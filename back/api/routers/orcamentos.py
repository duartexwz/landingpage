from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from psycopg import Connection

from api.database import get_db
from api.schemas.global_schemas import UsuarioLogado
from api.schemas.orcamento import OrcamentoIn, OrcamentoOut, OrcamentoPatch
from api.security import get_current_user
from api.services.orcamentos_services import OrcamentosServices

orcamentos_services = OrcamentosServices()

T_CurrentUser = Annotated[UsuarioLogado, Depends(get_current_user)]
T_Session = Annotated[Connection, Depends(get_db)]

router = APIRouter(
    prefix='/orcamentos',
    tags=['orcamentos'],
)


@router.post(
    '',
    summary='Enviar orçamento (formulário público)',
    status_code=HTTPStatus.CREATED,
    response_model=OrcamentoOut,
    include_in_schema=False,
)
@router.post(
    '/',
    summary='Enviar orçamento (formulário público)',
    status_code=HTTPStatus.CREATED,
    response_model=OrcamentoOut,
)
def create_orcamento(db: T_Session, request: Request, payload: OrcamentoIn):
    ip = request.client.host if request.client else None
    ua = request.headers.get('user-agent')
    return orcamentos_services.create_orcamento(db, payload, ip=ip, user_agent=ua)


@router.get(
    '',
    summary='Listar orçamentos (painel)',
    response_model=list[OrcamentoOut],
    include_in_schema=False,
)
@router.get(
    '/', summary='Listar orçamentos (painel)', response_model=list[OrcamentoOut]
)
def list_orcamentos(
    db: T_Session,
    _user: T_CurrentUser,
    status: Annotated[str | None, Query()] = None,
    busca: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(le=200)] = 50,
    offset: int = 0,
):
    return orcamentos_services.list_orcamentos(
        db, status=status, busca=busca, limit=limit, offset=offset
    )


@router.get('/{oid}', summary='Detalhar orçamento', response_model=OrcamentoOut)
def get_orcamento(db: T_Session, _user: T_CurrentUser, oid: str):
    return orcamentos_services.get_orcamento(db, oid)


@router.patch('/{oid}', summary='Atualizar status/lido', response_model=OrcamentoOut)
def update_orcamento(
    db: T_Session, _user: T_CurrentUser, oid: str, payload: OrcamentoPatch
):
    return orcamentos_services.update_orcamento(db, oid, payload.model_dump())


@router.delete(
    '/{oid}', summary='Excluir orçamento', status_code=HTTPStatus.NO_CONTENT
)
def delete_orcamento(db: T_Session, _user: T_CurrentUser, oid: str):
    orcamentos_services.delete_orcamento(db, oid)
