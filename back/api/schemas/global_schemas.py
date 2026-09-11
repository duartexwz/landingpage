from __future__ import annotations

from pydantic import BaseModel


class MessageGlobal(BaseModel):
    detail: str


class UsuarioLogado(BaseModel):
    id: str
    nome: str = ''
    email: str = ''
