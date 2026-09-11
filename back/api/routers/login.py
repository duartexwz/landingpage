from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends
from psycopg import Connection

from api.database import get_db
from api.schemas.auth import LoginIn, RefreshIn, TokenOut
from api.schemas.global_schemas import MessageGlobal
from api.services.auth_services import AuthServices
from api.settings import Settings, get_settings

auth_services = AuthServices()

T_Session = Annotated[Connection, Depends(get_db)]
T_Settings = Annotated[Settings, Depends(get_settings)]

router = APIRouter(tags=['login'])


@router.post('/login', summary='Login do painel', response_model=TokenOut)
def login(db: T_Session, s: T_Settings, payload: LoginIn):
    return auth_services.login(db, payload, s)


@router.post(
    '/refresh', summary='Renovar tokens (refresh 7 dias)', response_model=TokenOut
)
def refresh(db: T_Session, s: T_Settings, payload: RefreshIn):
    return auth_services.refresh(db, payload.refresh_token, s)


@router.post(
    '/logout',
    summary='Revogar refresh',
    status_code=HTTPStatus.NO_CONTENT,
    response_model=None,
)
def logout(db: T_Session, s: T_Settings, payload: RefreshIn):
    auth_services.logout(db, payload.refresh_token, s)


@router.get('/me', summary='Usuário logado', response_model=MessageGlobal)
def me():
    return MessageGlobal(
        detail='Use o access token no header Authorization: Bearer <token>'
    )
