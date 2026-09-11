from __future__ import annotations

from http import HTTPStatus

from fastapi import HTTPException
from psycopg import Connection

from api.repositories.orcamentos_repository import OrcamentosRepository
from api.schemas.orcamento import OrcamentoIn, OrcamentoOut


def _out(r: dict) -> OrcamentoOut:
    return OrcamentoOut(
        id=str(r['id']),
        nome=r['nome'],
        email=r['email'],
        telefone=r.get('telefone'),
        tipo_projeto=r['tipo_projeto'],
        orcamento_estimado=r['orcamento_estimado'],
        mensagem=r['mensagem'],
        status=str(r['status']),
        origem=r['origem'],
        lido=r['lido'],
        criado_em=r.get('criado_em'),
        atualizado_em=r.get('atualizado_em'),
    )


class OrcamentosServices:
    def __init__(self):
        self.orcamentos_repository = OrcamentosRepository()

    def create_orcamento(
        self,
        db: Connection,
        payload: OrcamentoIn,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> OrcamentoOut:
        nome = payload.nome.strip()
        email = str(payload.email).lower()
        mensagem = payload.mensagem.strip()
        telefone = payload.telefone.strip() if payload.telefone else None
        if self.orcamentos_repository.ja_enviado_hoje(db, email, mensagem):
            raise HTTPException(
                detail='Este orçamento já foi enviado. Aguarde nosso retorno!',
                status_code=HTTPStatus.CONFLICT,
            )
        row = self.orcamentos_repository.criar(
            db,
            {
                'nome': nome,
                'email': email,
                'telefone': telefone,
                'tipo_projeto': payload.tipo_projeto,
                'orcamento_estimado': payload.orcamento_estimado,
                'mensagem': mensagem,
                'consent_lgpd': payload.consent_lgpd,
                'origem': 'site',
                'ip': ip,
                'user_agent': user_agent,
            },
        )
        with db.cursor() as cur:
            cur.execute(
                'INSERT INTO consentimentos '
                '(email, finalidade, aceito, ip) VALUES (%s,%s,%s,%s)',
                (email, 'contato_orcamento', payload.consent_lgpd, ip),
            )
        return _out(row)

    def list_orcamentos(
        self,
        db: Connection,
        *,
        status: str | None = None,
        busca: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[OrcamentoOut]:
        filtros: dict = {}
        if status:
            filtros['status'] = status
        rows = self.orcamentos_repository.listar(db, filtros, limit, offset)
        if busca:
            b = busca.lower()
            rows = [
                r
                for r in rows
                if b in r['nome'].lower()
                or b in r['email'].lower()
                or b in r['mensagem'].lower()
                or b in (r.get('telefone') or '')
            ]
        return [_out(r) for r in rows]

    def get_orcamento(self, db: Connection, oid: str) -> OrcamentoOut:
        row = self.orcamentos_repository.buscar_por_id(db, oid)
        if not row:
            raise HTTPException(
                detail='Orçamento não encontrado', status_code=HTTPStatus.NOT_FOUND
            )
        return _out(row)

    def update_orcamento(
        self, db: Connection, oid: str, dados: dict
    ) -> OrcamentoOut:
        row = self.orcamentos_repository.atualizar(db, oid, dados)
        if not row:
            raise HTTPException(
                detail='Orçamento não encontrado', status_code=HTTPStatus.NOT_FOUND
            )
        return _out(row)

    def delete_orcamento(self, db: Connection, oid: str) -> None:
        if not self.orcamentos_repository.excluir(db, oid):
            raise HTTPException(
                detail='Orçamento não encontrado', status_code=HTTPStatus.NOT_FOUND
            )
