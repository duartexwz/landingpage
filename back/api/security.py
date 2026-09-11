from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash

from api.schemas.global_schemas import UsuarioLogado
from api.settings import Settings, get_settings

_pwd = PasswordHash.recommended()
_bearer = HTTPBearer(auto_error=False)


def hash_senha(senha: str) -> str:
    return _pwd.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        return _pwd.verify(senha, senha_hash)
    except Exception:
        return False


def _now() -> datetime:
    return datetime.now(timezone.utc)


def criar_access(admin_id: str, s: Settings) -> str:
    exp = _now() + timedelta(minutes=s.ACCESS_TOKEN_MINUTES)
    return jwt.encode(
        {'sub': admin_id, 'typ': 'access', 'exp': exp},
        s.JWT_SECRET,
        algorithm=s.JWT_ALG,
    )


def criar_refresh(admin_id: str, s: Settings) -> tuple[str, str, datetime]:
    jti = uuid.uuid4().hex
    exp = _now() + timedelta(days=s.REFRESH_TOKEN_DAYS)
    token = jwt.encode(
        {'sub': admin_id, 'typ': 'refresh', 'jti': jti, 'exp': exp},
        s.JWT_SECRET,
        algorithm=s.JWT_ALG,
    )
    return token, jti, exp


def decodificar(token: str, s: Settings) -> dict:
    try:
        return jwt.decode(token, s.JWT_SECRET, algorithms=[s.JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Token expirado')
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Token inválido')


def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    s: Settings = Depends(get_settings),
) -> UsuarioLogado:
    """Usuário logado a partir do Bearer access token. 401 se ausente/inválido."""
    if cred is None or not cred.credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Não autenticado')
    payload = decodificar(cred.credentials, s)
    if payload.get('typ') != 'access' or not payload.get('sub'):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Token inválido')
    return UsuarioLogado(id=str(payload['sub']))
