"""1 conexão por requisição (serverless-safe) + kwargs Neon.

Cada request abre 1 conexão psycopg curta e fecha no fim (sem pool
global — seguro em Vercel/Neon serverless). Neon exige SSL.
"""

from __future__ import annotations

from typing import Generator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import psycopg
from fastapi import Depends
from psycopg.rows import dict_row

from api.settings import Settings, get_settings


def neon_kwargs(url: str) -> dict:
    """Garante sslmode=require + timeout curto para o Neon."""
    parts = urlparse(url)
    qs = dict(parse_qsl(parts.query))
    qs.setdefault('sslmode', 'require')
    qs.setdefault('connect_timeout', '10')
    return {
        'conninfo': urlunparse(parts._replace(query=urlencode(qs))),
        'row_factory': dict_row,
    }


def get_db(
    s: Settings = Depends(get_settings),
) -> Generator[psycopg.Connection, None, None]:
    conn = psycopg.connect(**neon_kwargs(s.DATABASE_URL))
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
