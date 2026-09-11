from __future__ import annotations

import psycopg

from api.repositories.sql_repository import QueryRepository
from api.schemas.enums import Operador


class AdminsRepository(QueryRepository):
    table_name = 'admins'
    campos = (
        'id',
        'nome',
        'email',
        'senha_hash',
        'ativo',
        'criado_em',
        'atualizado_em',
    )
    mapa_filtros = {
        'id': Operador.IGUAL,
        'nome': Operador.ILIKE,
        'email': Operador.IGUAL,
    }

    def buscar_por_email(self, db: psycopg.Connection, email: str) -> dict | None:
        cols = ', '.join(self.campos)
        with db.cursor() as cur:
            cur.execute(
                f'SELECT {cols} FROM {self.table_name} WHERE email = %s',
                (email.lower(),),
            )
            return cur.fetchone()

    def criar(
        self, db: psycopg.Connection, *, nome: str, email: str, senha_hash: str
    ) -> dict:
        with db.cursor() as cur:
            cur.execute(
                f"""INSERT INTO {self.table_name} (nome, email, senha_hash)
                    VALUES (%s,%s,%s) RETURNING {', '.join(self.campos)}""",
                (nome, email.lower(), senha_hash),
            )
            return cur.fetchone()
