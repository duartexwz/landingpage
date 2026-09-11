from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from psycopg import Connection

from api.database import get_db
from api.schemas.global_schemas import UsuarioLogado
from api.security import get_current_user
from api.services.upload_services import UploadServices
from api.settings import Settings, get_settings

upload_services = UploadServices()

T_CurrentUser = Annotated[UsuarioLogado, Depends(get_current_user)]
T_Session = Annotated[Connection, Depends(get_db)]
T_Settings = Annotated[Settings, Depends(get_settings)]

router = APIRouter(tags=['upload'])


@router.post(
    '/upload', summary='Enviar imagem (painel)', status_code=HTTPStatus.CREATED
)
async def enviar_imagem(
    db: T_Session, _user: T_CurrentUser, s: T_Settings, file: UploadFile = File(...)
):
    svc = UploadServices(
        upload_dir=s.UPLOAD_DIR,
        max_mb=s.MAX_UPLOAD_MB,
        blob_token=s.BLOB_READ_WRITE_TOKEN,
        r2_account_id=s.R2_ACCOUNT_ID,
        r2_access_key_id=s.R2_ACCESS_KEY_ID,
        r2_secret_access_key=s.R2_SECRET_ACCESS_KEY,
        r2_bucket=s.R2_BUCKET,
        r2_public_url=s.R2_PUBLIC_URL,
    )
    return await svc.salvar(db, file)
