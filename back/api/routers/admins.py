from typing import Annotated

from fastapi import APIRouter, Depends
from psycopg import Connection

from api.database import get_db
from api.schemas.auth import AdminOut
from api.services.auth_services import AuthServices
from api.settings import Settings, get_settings

auth_services = AuthServices()

T_Session = Annotated[Connection, Depends(get_db)]
T_Settings = Annotated[Settings, Depends(get_settings)]

router = APIRouter(tags=['admins'])


@router.post(
    '/admins/seed',
    summary='Criar admin de SEED_ADMIN_* (idempotente)',
    response_model=AdminOut,
)
def seed_admin(db: T_Session, s: T_Settings):
    return auth_services.seed_admin(db, s)
