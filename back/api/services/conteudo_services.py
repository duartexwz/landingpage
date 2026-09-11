from __future__ import annotations

from http import HTTPStatus

from fastapi import HTTPException
from psycopg import Connection

from api.repositories.conteudo_repository import ConteudoRepository
from api.schemas.conteudo import (
    DepoimentoOut,
    DepoimentoPublicoIn,
    ProjetoOut,
    SiteIn,
)

BIO_PADRAO = {
    'titulo': 'Lógica de engenharia,\nresultado de negócio.',
    'texto': 'Acredito que todo processo repetitivo é um sistema esperando '
    'ser construído.',
    'sub': '',
}
FOTO_PADRAO = ''


def _proj(r: dict) -> ProjetoOut:
    return ProjetoOut(
        id=str(r['id']),
        titulo=r['titulo'],
        problema=r.get('problema') or '',
        solucao=r.get('solucao') or '',
        imagem_url=r.get('imagem_url'),
        capa_url=r.get('capa_url'),
        imagens=r.get('imagens') or [],
        link_url=r.get('link_url'),
        como_foi_feito=r.get('como_foi_feito') or '',
        estrutura_pastas=r.get('estrutura_pastas') or '',
        linguagens=r.get('linguagens') or '',
        ordem=r.get('ordem') or 0,
        ativo=r.get('ativo', True),
    )


def _dep(r: dict) -> DepoimentoOut:
    return DepoimentoOut(
        id=str(r['id']),
        texto=r['texto'],
        nome=r['nome'],
        cargo=r.get('cargo') or '',
        avatar_url=r.get('avatar_url'),
        ordem=r.get('ordem') or 0,
        ativo=r.get('ativo', True),
    )


def _nao_encontrado(recurso: str) -> HTTPException:
    return HTTPException(
        detail=f'{recurso} não encontrado', status_code=HTTPStatus.NOT_FOUND
    )


class ConteudoServices:
    def __init__(self):
        self.repo = ConteudoRepository()

    def obter_site(self, db: Connection) -> dict:
        bio = self.repo.obter_config(db, 'bio', BIO_PADRAO)
        foto = self.repo.obter_config(db, 'foto_url', FOTO_PADRAO)
        return {
            'bio': bio,
            'foto_url': foto,
            'projetos': [
                _proj(r).model_dump() for r in self.repo.listar_projetos(db, True)
            ],
            'depoimentos': [
                _dep(r).model_dump() for r in self.repo.listar_depoimentos(db, True)
            ],
        }

    def salvar_site(self, db: Connection, payload: SiteIn) -> dict:
        if payload.bio is not None:
            self.repo.salvar_config(db, 'bio', payload.bio.model_dump())
        if payload.foto_url is not None:
            self.repo.salvar_config(db, 'foto_url', payload.foto_url)
        return self.obter_site(db)

    # ---- projetos (admin vê todos; site só ativos) ----
    def listar_projetos(self, db: Connection, so_ativos: bool) -> list[ProjetoOut]:
        return [_proj(r) for r in self.repo.listar_projetos(db, so_ativos)]

    def criar_projeto(self, db: Connection, dados: dict) -> ProjetoOut:
        return _proj(self.repo.criar_projeto(db, dados))

    def atualizar_projeto(self, db: Connection, pid: str, dados: dict) -> ProjetoOut:
        row = self.repo.atualizar_projeto(db, pid, dados)
        if not row:
            raise _nao_encontrado('Projeto')
        return _proj(row)

    def excluir_projeto(self, db: Connection, pid: str) -> None:
        if not self.repo.excluir_projeto(db, pid):
            raise _nao_encontrado('Projeto')

    # ---- depoimentos ----
    def listar_depoimentos(
        self, db: Connection, so_ativos: bool
    ) -> list[DepoimentoOut]:
        return [_dep(r) for r in self.repo.listar_depoimentos(db, so_ativos)]

    def criar_depoimento(self, db: Connection, dados: dict) -> DepoimentoOut:
        return _dep(self.repo.criar_depoimento(db, dados))

    def enviar_depoimento(
        self, db: Connection, payload: DepoimentoPublicoIn
    ) -> DepoimentoOut:
        """Feedback enviado pelo cliente no site: entra pendente (ativo=False)."""
        return _dep(
            self.repo.criar_depoimento(
                db,
                {
                    'texto': payload.texto.strip(),
                    'nome': payload.nome.strip(),
                    'cargo': payload.cargo.strip(),
                    'avatar_url': None,
                    'ordem': 99,
                    'ativo': False,
                },
            )
        )

    def atualizar_depoimento(
        self, db: Connection, did: str, dados: dict
    ) -> DepoimentoOut:
        row = self.repo.atualizar_depoimento(db, did, dados)
        if not row:
            raise _nao_encontrado('Depoimento')
        return _dep(row)

    def excluir_depoimento(self, db: Connection, did: str) -> None:
        if not self.repo.excluir_depoimento(db, did):
            raise _nao_encontrado('Depoimento')
