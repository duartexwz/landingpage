from __future__ import annotations

from pydantic import BaseModel, Field


class BioIn(BaseModel):
    titulo: str = Field(min_length=2, max_length=200)
    texto: str = Field(min_length=2, max_length=2000)
    sub: str | None = Field(default=None, max_length=500)


class SiteIn(BaseModel):
    bio: BioIn | None = None
    foto_url: str | None = Field(default=None, max_length=500)


class ProjetoIn(BaseModel):
    titulo: str = Field(min_length=2, max_length=120)
    problema: str = Field(default='', max_length=2000)
    solucao: str = Field(default='', max_length=2000)
    imagem_url: str | None = Field(default=None, max_length=500)
    capa_url: str | None = Field(default=None, max_length=500)
    imagens: list[str] = Field(default_factory=list)
    link_url: str | None = Field(default=None, max_length=500)
    como_foi_feito: str = Field(default='', max_length=10000)
    estrutura_pastas: str = Field(default='', max_length=5000)
    linguagens: str = Field(default='', max_length=500)
    ordem: int = 0
    ativo: bool = True


class ProjetoOut(ProjetoIn):
    id: str


class ProjetoPatch(BaseModel):
    titulo: str | None = Field(default=None, min_length=2, max_length=120)
    problema: str | None = None
    solucao: str | None = None
    imagem_url: str | None = None
    capa_url: str | None = None
    imagens: list[str] | None = None
    link_url: str | None = None
    como_foi_feito: str | None = None
    estrutura_pastas: str | None = None
    linguagens: str | None = None
    ordem: int | None = None
    ativo: bool | None = None


class DepoimentoIn(BaseModel):
    texto: str = Field(min_length=2, max_length=1000)
    nome: str = Field(min_length=2, max_length=120)
    cargo: str = Field(default='', max_length=120)
    avatar_url: str | None = Field(default=None, max_length=500)
    ordem: int = 0
    ativo: bool = True


class DepoimentoOut(DepoimentoIn):
    id: str


class DepoimentoPatch(BaseModel):
    texto: str | None = None
    nome: str | None = None
    cargo: str | None = None
    avatar_url: str | None = None
    ordem: int | None = None
    ativo: bool | None = None


class DepoimentoPublicoIn(BaseModel):
    texto: str = Field(min_length=10, max_length=1000)
    nome: str = Field(min_length=2, max_length=120)
    cargo: str = Field(default='', max_length=120)
