"""Aplica schema.sql / migrations/*.sql no Postgres (Neon-safe).

Uso:
  python migrate.py                # aplica schema.sql
  python migrate.py --migrations   # aplica migrations/*.sql em ordem
  DATABASE_URL=postgresql://... python migrate.py

Compatível com Neon (serverless): 1 conexão curta por execução,
SSL obrigatório, sem pool.
"""

from __future__ import annotations

import argparse
import os
import pathlib
import sys

import psycopg
from dotenv import load_dotenv

load_dotenv()
load_dotenv('.env')

BASE = pathlib.Path(__file__).resolve().parent


def _connect():
    url = os.getenv('DATABASE_URL')
    if not url:
        print('ERRO: defina DATABASE_URL no .env', file=sys.stderr)
        sys.exit(1)
    # Neon exige SSL
    if 'sslmode' not in url:
        sep = '&' if '?' in url else '?'
        url = f'{url}{sep}sslmode=require'
    return psycopg.connect(url, connect_timeout=15)


def _expand_includes(path: pathlib.Path, seen: set | None = None) -> str:
    r"""Expande comandos psql `\i outro.sql` (caminho relativo ao arquivo)."""
    seen = seen or set()
    if path in seen:
        return ''
    seen.add(path)
    out: list[str] = []
    for ln in path.read_text(encoding='utf-8').splitlines():
        s = ln.strip()
        if s.startswith('\\i '):
            inc = (path.parent / s[3:].strip()).resolve()
            out.append(f'-- include {inc.name}')
            out.append(_expand_includes(inc, seen))
        else:
            out.append(ln)
    return '\n'.join(out)


def apply_file(conn, path: pathlib.Path):
    sql = _expand_includes(path)
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f'OK aplicado: {path.name}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        '--migrations',
        action='store_true',
        help='aplica back/migrations/*.sql em vez de schema.sql',
    )
    args = ap.parse_args()

    if args.migrations:
        files = sorted((BASE / 'migrations').glob('*.sql'))
    else:
        files = [BASE / 'schema.sql']
    for f in files:
        if not f.exists():
            print(f'Arquivo não encontrado: {f}', file=sys.stderr)
            sys.exit(1)
    with _connect() as conn:
        for f in files:
            apply_file(conn, f)
    print('Migração concluída.')


if __name__ == '__main__':
    main()
