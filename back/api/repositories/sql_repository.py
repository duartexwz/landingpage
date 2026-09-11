"""Repository base: SQL parametrizado sobre psycopg (1 conexão/request).

Espelha o padrão do projeto anterior (table_name, campos, mapa_filtros),
adaptado de asyncpg para psycopg síncrono (serverless-safe).
"""

from __future__ import annotations

from typing import Any

import psycopg

from api.schemas.enums import Operador


class QueryRepository:
    table_name: str = ''
    campos: tuple[str, ...] = ('id',)
    mapa_filtros: dict[str, Operador] = {'id': Operador.IGUAL}

    def existe(self, db: psycopg.Connection, campo: str, valor: Any) -> bool:
        with db.cursor() as cur:
            cur.execute(
                f'SELECT 1 FROM {self.table_name} WHERE {campo} = %s LIMIT 1',
                (valor,),
            )
            return cur.fetchone() is not None

    def buscar_por_id(self, db: psycopg.Connection, rid: str) -> dict | None:
        cols = ', '.join(self.campos)
        with db.cursor() as cur:
            cur.execute(
                f'SELECT {cols} FROM {self.table_name} WHERE id = %s',
                (rid,),
            )
            return cur.fetchone()

    def listar(
        self,
        db: psycopg.Connection,
        filtros: dict[str, Any] | None = None,
        limit: int = 50,
        offset: int = 0,
        ordem: str = 'criado_em DESC',
    ) -> list[dict]:
        filtros = filtros or {}
        sql = f'SELECT {", ".join(self.campos)} FROM {self.table_name}'
        params: list[Any] = []
        conds: list[str] = []
        for campo, valor in filtros.items():
            if valor is None or valor == '' or campo not in self.mapa_filtros:
                continue
            op = self.mapa_filtros[campo]
            if op == Operador.ILIKE:
                conds.append(f'{campo} ILIKE %s')
                params.append(f'%{valor}%')
            else:
                conds.append(f'{campo} {op.value} %s')
                params.append(valor)
        if conds:
            sql += ' WHERE ' + ' AND '.join(conds)
        sql += f' ORDER BY {ordem} LIMIT %s OFFSET %s'
        params += [limit, offset]
        with db.cursor() as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())

    def excluir(self, db: psycopg.Connection, rid: str) -> bool:
        with db.cursor() as cur:
            cur.execute(f'DELETE FROM {self.table_name} WHERE id = %s', (rid,))
            return cur.rowcount > 0
