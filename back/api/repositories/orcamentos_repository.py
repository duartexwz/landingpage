from __future__ import annotations

import psycopg

from api.repositories.sql_repository import QueryRepository
from api.schemas.enums import Operador


class OrcamentosRepository(QueryRepository):
    table_name = 'orcamentos'
    campos = (
        'id',
        'nome',
        'email',
        'telefone',
        'tipo_projeto',
        'orcamento_estimado',
        'mensagem',
        'status',
        'origem',
        'lido',
        'consent_lgpd',
        'criado_em',
        'atualizado_em',
    )
    mapa_filtros = {
        'id': Operador.IGUAL,
        'nome': Operador.ILIKE,
        'email': Operador.ILIKE,
        'mensagem': Operador.ILIKE,
        'tipo_projeto': Operador.IGUAL,
        'status': Operador.IGUAL,
        'lido': Operador.IGUAL,
    }

    COLUNAS_INSERT = (
        'nome',
        'email',
        'telefone',
        'tipo_projeto',
        'orcamento_estimado',
        'mensagem',
        'consent_lgpd',
        'origem',
        'ip',
        'user_agent',
    )

    def criar(self, db: psycopg.Connection, dados: dict) -> dict:
        cols = ', '.join(self.COLUNAS_INSERT)
        marcas = ', '.join(['%s'] * len(self.COLUNAS_INSERT))
        with db.cursor() as cur:
            cur.execute(
                f'INSERT INTO {self.table_name} ({cols}) '
                f'VALUES ({marcas}) '
                f'RETURNING {", ".join(self.campos)}',
                [dados[c] for c in self.COLUNAS_INSERT],
            )
            return cur.fetchone()

    def atualizar(
        self, db: psycopg.Connection, rid: str, dados: dict
    ) -> dict | None:
        dados = {
            k: v
            for k, v in dados.items()
            if v is not None and k in ('status', 'lido')
        }
        if not dados:
            return self.buscar_por_id(db, rid)
        sets = ', '.join(f'{k} = %s' for k in dados)
        cols = ', '.join(self.campos)
        with db.cursor() as cur:
            cur.execute(
                f'UPDATE {self.table_name} SET {sets} '
                f'WHERE id = %s RETURNING {cols}',
                (*dados.values(), rid),
            )
            return cur.fetchone()

    def ja_enviado_hoje(
        self, db: psycopg.Connection, email: str, mensagem: str
    ) -> bool:
        """Anti-spam: mesma mensagem do mesmo e-mail nas últimas 24h."""
        with db.cursor() as cur:
            cur.execute(
                f'SELECT 1 FROM {self.table_name} '
                'WHERE email = %s AND mensagem = %s '
                "AND criado_em > now() - interval '24 hours' "
                'LIMIT 1',
                (email, mensagem),
            )
            return cur.fetchone() is not None
