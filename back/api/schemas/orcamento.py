from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

TipoProjeto = Literal[
    'Desenvolvimento de APIs',
    'Landing Pages',
    'Web Apps',
    'Automações de Processos',
    'Outro',
]
FaixaOrcamento = Literal[
    'R$ 800 - 1k',
    'R$ 2k - 3,5k',
    'R$ 3k - 5k',
    'R$ 3k - 6k',
    'Ainda não sei (sob consulta)',
]
StatusOrcamento = Literal['novo', 'em_atendimento', 'convertido', 'arquivado']


class OrcamentoIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    telefone: str | None = Field(default=None, max_length=20)
    tipo_projeto: TipoProjeto = 'Desenvolvimento de APIs'
    orcamento_estimado: FaixaOrcamento = 'Ainda não sei (sob consulta)'
    mensagem: str = Field(min_length=10, max_length=5000)
    consent_lgpd: bool = True


class OrcamentoOut(BaseModel):
    id: str
    nome: str
    email: str
    telefone: str | None = None
    tipo_projeto: str
    orcamento_estimado: str
    mensagem: str
    status: str
    origem: str
    lido: bool
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None


class OrcamentoPatch(BaseModel):
    status: StatusOrcamento | None = None
    lido: bool | None = None


class ConsentIn(BaseModel):
    email: EmailStr
    finalidade: str = 'contato_orcamento'
    aceito: bool = True
