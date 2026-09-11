from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends
from psycopg import Connection

from api.database import get_db
from api.schemas.conteudo import (
    DepoimentoIn,
    DepoimentoOut,
    DepoimentoPatch,
    DepoimentoPublicoIn,
    ProjetoIn,
    ProjetoOut,
    ProjetoPatch,
    SiteIn,
)
from api.schemas.global_schemas import UsuarioLogado
from api.security import get_current_user
from api.services.conteudo_services import ConteudoServices

conteudo_services = ConteudoServices()

T_CurrentUser = Annotated[UsuarioLogado, Depends(get_current_user)]
T_Session = Annotated[Connection, Depends(get_db)]

router = APIRouter(tags=['conteudo'])


@router.get('/conteudo', summary='Conteúdo da landing (público)')
def obter_site(db: T_Session):
    return conteudo_services.obter_site(db)


@router.put('/conteudo/site', summary='Editar bio e foto (painel)')
def salvar_site(db: T_Session, _user: T_CurrentUser, payload: SiteIn):
    return conteudo_services.salvar_site(db, payload)


@router.get(
    '/conteudo/projetos', summary='Listar projetos', response_model=list[ProjetoOut]
)
def listar_projetos(db: T_Session, _user: T_CurrentUser):
    return conteudo_services.listar_projetos(db, False)


@router.post(
    '/conteudo/projetos',
    summary='Adicionar projeto',
    status_code=HTTPStatus.CREATED,
    response_model=ProjetoOut,
)
def criar_projeto(db: T_Session, _user: T_CurrentUser, payload: ProjetoIn):
    return conteudo_services.criar_projeto(db, payload.model_dump())


@router.patch(
    '/conteudo/projetos/{pid}', summary='Editar projeto', response_model=ProjetoOut
)
def atualizar_projeto(
    db: T_Session, _user: T_CurrentUser, pid: str, payload: ProjetoPatch
):
    return conteudo_services.atualizar_projeto(db, pid, payload.model_dump())


@router.delete(
    '/conteudo/projetos/{pid}',
    summary='Remover projeto',
    status_code=HTTPStatus.NO_CONTENT,
)
def excluir_projeto(db: T_Session, _user: T_CurrentUser, pid: str):
    conteudo_services.excluir_projeto(db, pid)


@router.post(
    '/conteudo/depoimentos/enviar',
    summary='Enviar feedback (site, entra pendente)',
    status_code=HTTPStatus.CREATED,
    response_model=DepoimentoOut,
)
def enviar_depoimento(db: T_Session, payload: DepoimentoPublicoIn):
    return conteudo_services.enviar_depoimento(db, payload)


@router.get(
    '/conteudo/depoimentos',
    summary='Listar depoimentos',
    response_model=list[DepoimentoOut],
)
def listar_depoimentos(db: T_Session, _user: T_CurrentUser):
    return conteudo_services.listar_depoimentos(db, False)


@router.post(
    '/conteudo/depoimentos',
    summary='Adicionar depoimento',
    status_code=HTTPStatus.CREATED,
    response_model=DepoimentoOut,
)
def criar_depoimento(db: T_Session, _user: T_CurrentUser, payload: DepoimentoIn):
    return conteudo_services.criar_depoimento(db, payload.model_dump())


@router.patch(
    '/conteudo/depoimentos/{did}',
    summary='Editar depoimento',
    response_model=DepoimentoOut,
)
def atualizar_depoimento(
    db: T_Session, _user: T_CurrentUser, did: str, payload: DepoimentoPatch
):
    return conteudo_services.atualizar_depoimento(db, did, payload.model_dump())


@router.delete(
    '/conteudo/depoimentos/{did}',
    summary='Remover depoimento',
    status_code=HTTPStatus.NO_CONTENT,
)
def excluir_depoimento(db: T_Session, _user: T_CurrentUser, did: str):
    conteudo_services.excluir_depoimento(db, did)
