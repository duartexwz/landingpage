from __future__ import annotations

from http import HTTPStatus

from fastapi import HTTPException
from psycopg import Connection

from api.repositories.admins_repository import AdminsRepository
from api.schemas.auth import AdminOut, LoginIn, TokenOut
from api.security import (
    criar_access,
    criar_refresh,
    decodificar,
    hash_senha,
    verificar_senha,
)
from api.settings import Settings

SQL_INSERT_REFRESH = (
    'INSERT INTO refresh_tokens (admin_id, jti, expira_em) VALUES (%s,%s,%s)'
)


def _out(r: dict) -> AdminOut:
    return AdminOut(
        id=str(r['id']), nome=r['nome'], email=r['email'], ativo=r['ativo']
    )


class AuthServices:
    def __init__(self):
        self.admins_repository = AdminsRepository()

    def login(self, db: Connection, payload: LoginIn, s: Settings) -> TokenOut:
        row = self.admins_repository.buscar_por_email(db, str(payload.email))
        if (
            not row
            or not row['ativo']
            or not verificar_senha(payload.senha, row['senha_hash'])
        ):
            raise HTTPException(
                detail='Credenciais inválidas', status_code=HTTPStatus.UNAUTHORIZED
            )
        admin_id = str(row['id'])
        access = criar_access(admin_id, s)
        refresh, jti, exp = criar_refresh(admin_id, s)
        with db.cursor() as cur:
            cur.execute(
                SQL_INSERT_REFRESH,
                (admin_id, jti, exp),
            )
        return TokenOut(access_token=access, refresh_token=refresh)

    def refresh(self, db: Connection, refresh_token: str, s: Settings) -> TokenOut:
        payload = decodificar(refresh_token, s)
        if payload.get('typ') != 'refresh':
            raise HTTPException(
                detail='Refresh inválido', status_code=HTTPStatus.UNAUTHORIZED
            )
        with db.cursor() as cur:
            cur.execute(
                'SELECT admin_id, revogado FROM refresh_tokens WHERE jti = %s',
                (payload.get('jti'),),
            )
            row = cur.fetchone()
        if not row or row['revogado']:
            raise HTTPException(
                detail='Refresh revogado', status_code=HTTPStatus.UNAUTHORIZED
            )
        admin_id = str(row['admin_id'])
        with db.cursor() as cur:
            cur.execute(
                'UPDATE refresh_tokens SET revogado = TRUE WHERE jti = %s',
                (payload.get('jti'),),
            )
        access = criar_access(admin_id, s)
        new_refresh, jti, exp = criar_refresh(admin_id, s)
        with db.cursor() as cur:
            cur.execute(
                SQL_INSERT_REFRESH,
                (admin_id, jti, exp),
            )
        return TokenOut(access_token=access, refresh_token=new_refresh)

    def logout(self, db: Connection, refresh_token: str, s: Settings) -> None:
        try:
            payload = decodificar(refresh_token, s)
            with db.cursor() as cur:
                cur.execute(
                    'UPDATE refresh_tokens SET revogado = TRUE WHERE jti = %s',
                    (payload.get('jti'),),
                )
        except HTTPException:
            pass

    def seed_admin(self, db: Connection, s: Settings) -> AdminOut:
        """Cria o admin de SEED_ADMIN_* se ainda não existir (idempotente)."""
        row = self.admins_repository.buscar_por_email(db, s.SEED_ADMIN_EMAIL)
        if row:
            return _out(row)
        return _out(
            self.admins_repository.criar(
                db,
                nome=s.SEED_ADMIN_NOME,
                email=s.SEED_ADMIN_EMAIL,
                senha_hash=hash_senha(s.SEED_ADMIN_SENHA),
            )
        )
