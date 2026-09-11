from __future__ import annotations

import os
import uuid
from http import HTTPStatus
from pathlib import Path

import httpx
from fastapi import HTTPException, UploadFile
from psycopg import Connection

EXTENSOES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
}


def _pasta_upload(base: str) -> Path:
    pasta = Path(base)
    if not pasta.is_absolute():
        pasta = Path(__file__).resolve().parent.parent.parent / base
    try:
        pasta.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass  # ex.: filesystem somente-leitura na Vercel — uploads vão p/ R2/Blob
    return pasta


class UploadServices:
    """Destino do upload: R2 (se configurado) → Vercel Blob → disco local."""

    def __init__(
        self,
        upload_dir: str = 'uploads',
        max_mb: int = 5,
        blob_token: str = '',
        r2_account_id: str = '',
        r2_access_key_id: str = '',
        r2_secret_access_key: str = '',
        r2_bucket: str = 'landingpage',
        r2_public_url: str = '',
    ):
        self.upload_dir = upload_dir
        self.max_mb = max_mb
        self.blob_token = blob_token
        self.r2_account_id = r2_account_id
        self.r2_access_key_id = r2_access_key_id
        self.r2_secret_access_key = r2_secret_access_key
        self.r2_bucket = r2_bucket
        self.r2_public_url = r2_public_url

    @property
    def r2_configurado(self) -> bool:
        return bool(
            self.r2_account_id and self.r2_access_key_id and self.r2_secret_access_key
        )

    def url_publica_r2(self, chave: str) -> str:
        return f'{self.r2_public_url.rstrip("/")}/{chave}'

    async def salvar(self, _db: Connection, file: UploadFile) -> dict:
        ext = Path(file.filename or '').suffix.lower()
        if ext not in EXTENSOES:
            raise HTTPException(
                detail='Apenas imagens (png, jpg, jpeg, webp, gif)',
                status_code=HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
            )
        data = await file.read()
        if len(data) > self.max_mb * 1024 * 1024:
            raise HTTPException(
                detail=f'Máximo {self.max_mb}MB',
                status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            )
        if not data.startswith(tuple(self._assinaturas(ext))):
            raise HTTPException(
                detail='Arquivo inválido',
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            )
        nome = f'{uuid.uuid4().hex}{ext}'
        if self.r2_configurado:
            if not self.r2_public_url:
                raise HTTPException(
                    detail='R2 sem URL pública (configure R2_PUBLIC_URL)',
                    status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                )
            chave = f'landing/{nome}'
            await self._enviar_r2(chave, data, EXTENSOES[ext])
            url = self.url_publica_r2(chave)
        elif self.blob_token:
            url = await self._enviar_blob(nome, data, EXTENSOES[ext])
        else:
            try:
                (_pasta_upload(self.upload_dir) / nome).write_bytes(data)
            except OSError:
                raise HTTPException(
                    detail='Upload indisponível: configure o R2 '
                    '(R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL)',
                    status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                )
            url = f'/uploads/{nome}'
        return {
            'url': url,
            'nome_original': file.filename,
            'tamanho_bytes': len(data),
        }

    async def _enviar_r2(self, chave: str, data: bytes, content_type: str) -> None:
        """Cloudflare R2 via API S3 (boto3 em threadpool p/ não travar o loop)."""
        from fastapi.concurrency import run_in_threadpool

        await run_in_threadpool(self._put_r2, chave, data, content_type)

    def _put_r2(self, chave: str, data: bytes, content_type: str) -> None:
        try:
            import boto3
        except ImportError:
            raise HTTPException(
                detail='boto3 não instalado',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            )
        s3 = boto3.client(
            's3',
            endpoint_url=f'https://{self.r2_account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=self.r2_access_key_id,
            aws_secret_access_key=self.r2_secret_access_key,
            region_name='auto',
        )
        try:
            s3.put_object(
                Bucket=self.r2_bucket,
                Key=chave,
                Body=data,
                ContentType=content_type,
            )
        except Exception as e:
            raise HTTPException(
                detail=f'Falha no upload (R2): {type(e).__name__}',
                status_code=HTTPStatus.BAD_GATEWAY,
            )

    async def _enviar_blob(self, nome: str, data: bytes, content_type: str) -> str:
        """Vercel Blob (produção — disco serverless é efêmero)."""
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.put(
                f'https://blob.vercel-storage.com/landing/{nome}',
                content=data,
                headers={
                    'Authorization': f'Bearer {self.blob_token}',
                    'Content-Type': content_type,
                    'x-api-version': '7',
                },
            )
        if r.status_code >= 400:
            raise HTTPException(
                detail='Falha no upload (Blob)',
                status_code=HTTPStatus.BAD_GATEWAY,
            )
        return r.json().get('url', '')

    @staticmethod
    def _assinaturas(ext: str) -> list[bytes]:
        return {
            '.png': [b'\x89PNG'],
            '.jpg': [b'\xff\xd8\xff'],
            '.jpeg': [b'\xff\xd8\xff'],
            '.webp': [b'RIFF'],
            '.gif': [b'GIF87a', b'GIF89a'],
        }[ext]


def pasta_upload_publica() -> Path:
    return _pasta_upload(os.getenv('UPLOAD_DIR', 'uploads'))
