from __future__ import annotations

import json

import psycopg
from psycopg.types.json import Json

CAMPOS_PROJ = (
    'id',
    'titulo',
    'problema',
    'solucao',
    'imagem_url',
    'capa_url',
    'imagens',
    'link_url',
    'como_foi_feito',
    'estrutura_pastas',
    'linguagens',
    'ordem',
    'ativo',
)
COLS_PROJ_WRITE = (
    'titulo',
    'problema',
    'solucao',
    'imagem_url',
    'capa_url',
    'imagens',
    'link_url',
    'como_foi_feito',
    'estrutura_pastas',
    'linguagens',
    'ordem',
    'ativo',
)
CAMPOS_DEP = ('id', 'texto', 'nome', 'cargo', 'avatar_url', 'ordem', 'ativo')


class ConteudoRepository:
    # ---- site_config (bio, foto_url) ----
    def obter_config(self, db: psycopg.Connection, chave: str, padrao):
        with db.cursor() as cur:
            cur.execute('SELECT valor FROM site_config WHERE chave = %s', (chave,))
            row = cur.fetchone()
            return row['valor'] if row else padrao

    def salvar_config(self, db: psycopg.Connection, chave: str, valor) -> None:
        with db.cursor() as cur:
            cur.execute(
                """INSERT INTO site_config (chave, valor, atualizado_em)
                   VALUES (%s, %s::jsonb, now())
                   ON CONFLICT (chave) DO UPDATE
                   SET valor = EXCLUDED.valor, atualizado_em = now()""",
                (chave, json.dumps(valor)),
            )

    # ---- projetos ----
    def listar_projetos(self, db: psycopg.Connection, so_ativos: bool) -> list[dict]:
        sql = f'SELECT {", ".join(CAMPOS_PROJ)} FROM projetos'
        if so_ativos:
            sql += ' WHERE ativo = TRUE'
        sql += ' ORDER BY ordem, criado_em'
        with db.cursor() as cur:
            cur.execute(sql)
            return list(cur.fetchall())

    def criar_projeto(self, db: psycopg.Connection, dados: dict) -> dict:
        cols = COLS_PROJ_WRITE
        with db.cursor() as cur:
            cur.execute(
                f'INSERT INTO projetos ({", ".join(cols)}) '
                f'VALUES ({", ".join(["%s"] * len(cols))}) '
                f'RETURNING {", ".join(CAMPOS_PROJ)}',
                [self._adapt(c, dados.get(c)) for c in cols],
            )
            return cur.fetchone()

    @staticmethod
    def _adapt(coluna: str, valor):
        if coluna == 'imagens':
            return Json(valor or [])
        return valor

    def atualizar_projeto(
        self, db: psycopg.Connection, pid: str, dados: dict
    ) -> dict | None:
        dados = {
            k: v for k, v in dados.items() if v is not None and k in COLS_PROJ_WRITE
        }
        if not dados:
            return self.buscar_projeto(db, pid)
        sets = ', '.join(f'{k} = %s' for k in dados)
        with db.cursor() as cur:
            cur.execute(
                f'UPDATE projetos SET {sets} WHERE id = %s '
                f'RETURNING {", ".join(CAMPOS_PROJ)}',
                (*[self._adapt(k, v) for k, v in dados.items()], pid),
            )
            return cur.fetchone()

    def buscar_projeto(self, db: psycopg.Connection, pid: str) -> dict | None:
        with db.cursor() as cur:
            cur.execute(
                f'SELECT {", ".join(CAMPOS_PROJ)} FROM projetos WHERE id = %s',
                (pid,),
            )
            return cur.fetchone()

    def excluir_projeto(self, db: psycopg.Connection, pid: str) -> bool:
        with db.cursor() as cur:
            cur.execute('DELETE FROM projetos WHERE id = %s', (pid,))
            return cur.rowcount > 0

    # ---- depoimentos ----
    def listar_depoimentos(
        self, db: psycopg.Connection, so_ativos: bool
    ) -> list[dict]:
        sql = f'SELECT {", ".join(CAMPOS_DEP)} FROM depoimentos'
        if so_ativos:
            sql += ' WHERE ativo = TRUE'
        sql += ' ORDER BY ordem, criado_em'
        with db.cursor() as cur:
            cur.execute(sql)
            return list(cur.fetchall())

    def criar_depoimento(self, db: psycopg.Connection, dados: dict) -> dict:
        cols = ('texto', 'nome', 'cargo', 'avatar_url', 'ordem', 'ativo')
        with db.cursor() as cur:
            cur.execute(
                f'INSERT INTO depoimentos ({", ".join(cols)}) '
                f'VALUES ({", ".join(["%s"] * len(cols))}) '
                f'RETURNING {", ".join(CAMPOS_DEP)}',
                [dados.get(c) for c in cols],
            )
            return cur.fetchone()

    def atualizar_depoimento(
        self, db: psycopg.Connection, did: str, dados: dict
    ) -> dict | None:
        dados = {
            k: v
            for k, v in dados.items()
            if v is not None
            and k in ('texto', 'nome', 'cargo', 'avatar_url', 'ordem', 'ativo')
        }
        if not dados:
            return self.buscar_depoimento(db, did)
        sets = ', '.join(f'{k} = %s' for k in dados)
        with db.cursor() as cur:
            cur.execute(
                f'UPDATE depoimentos SET {sets} WHERE id = %s '
                f'RETURNING {", ".join(CAMPOS_DEP)}',
                (*dados.values(), did),
            )
            return cur.fetchone()

    def buscar_depoimento(self, db: psycopg.Connection, did: str) -> dict | None:
        with db.cursor() as cur:
            cur.execute(
                f'SELECT {", ".join(CAMPOS_DEP)} FROM depoimentos WHERE id = %s',
                (did,),
            )
            return cur.fetchone()

    def excluir_depoimento(self, db: psycopg.Connection, did: str) -> bool:
        with db.cursor() as cur:
            cur.execute('DELETE FROM depoimentos WHERE id = %s', (did,))
            return cur.rowcount > 0
