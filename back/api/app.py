"""FastAPI + CORS + strip /api + lifespan sem pool (serverless-safe)."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from api.routers import admins, conteudo, login, orcamentos, upload
from api.services.upload_services import pasta_upload_publica
from api.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Sem pool global: cada requisição abre/fecha 1 conexão (Neon serverless).
    s = get_settings()
    app.state.env = s.ENV
    if not s.DATABASE_URL:
        print('AVISO: DATABASE_URL não definida')
    yield


def create_app() -> FastAPI:
    s = get_settings()
    app = FastAPI(title=s.APP_NAME, lifespan=lifespan)

    @app.middleware('http')
    async def strip_api_prefix(request: Request, call_next):
        # Vercel reescreve /api/* -> backend; aceita ambos com e sem /api
        if request.url.path == '/api' or request.url.path.startswith('/api/'):
            scope = request.scope
            scope['path'] = scope['path'][4:] or '/'
            request.scope['raw_path'] = request.scope['path'].encode()
        return await call_next(request)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.cors_list + ['*'] if s.ENV == 'dev' else s.cors_list,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    @app.get('/health')
    def health():
        return {'ok': True, 'env': s.ENV}

    @app.get('/')
    def root():
        return {'nome': s.APP_NAME, 'docs': '/docs', 'health': '/health'}

    for r in (
        login.router,
        admins.router,
        orcamentos.router,
        conteudo.router,
        upload.router,
    ):
        app.include_router(r)

    # Disco local (docker/dev). Na Vercel o FS é somente-leitura e efêmero:
    # sem a pasta, o StaticFiles levanta RuntimeError e o mount é pulado
    # (uploads vão p/ R2/Blob em produção).
    try:
        app.mount(
            '/uploads', StaticFiles(directory=pasta_upload_publica()), name='uploads'
        )
    except (RuntimeError, OSError):
        pass

    return app


app = create_app()


@app.exception_handler(Exception)
async def erro_interno(_: Request, exc: Exception):
    if 'HTTPException' in type(exc).__name__:
        raise exc
    return JSONResponse({'detail': 'Erro interno'}, status_code=500)
