"""Testes unitários (sem banco): schemas + auth JWT/Argon2 + services + OpenAPI."""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from api.app import app
from api.schemas import OrcamentoIn
from api.security import (
    criar_access,
    criar_refresh,
    decodificar,
    hash_senha,
    verificar_senha,
)
from api.services.orcamentos_services import OrcamentosServices
from api.settings import Settings


def test_orcamento_form_valido():
    o = OrcamentoIn(
        nome='Maria',
        email='maria@empresa.com',
        mensagem='Automatizar o financeiro, 200 notas/mês, prazo 30 dias',
    )
    assert o.tipo_projeto == 'Desenvolvimento de APIs'
    assert o.orcamento_estimado == 'Ainda não sei (sob consulta)'


def test_orcamento_mensagem_curta_rejeitada():
    with pytest.raises(ValidationError):
        OrcamentoIn(nome='Maria', email='maria@empresa.com', mensagem='curta')


def test_senha_argon2():
    h = hash_senha('Mk@220525')
    assert verificar_senha('Mk@220525', h) is True
    assert verificar_senha('errada', h) is False


def test_jwt_access_refresh():
    s = Settings(
        JWT_SECRET='segredo-teste-1234567890', DATABASE_URL='postgresql://x'
    )
    payload = decodificar(criar_access('admin-id-1', s), s)
    assert payload['sub'] == 'admin-id-1'
    assert payload['typ'] == 'access'
    refresh, jti, _ = criar_refresh('admin-id-1', s)
    payload2 = decodificar(refresh, s)
    assert payload2['typ'] == 'refresh'
    assert payload2['jti'] == jti


def test_services_instanciam_repositories():
    svc = OrcamentosServices()
    assert svc.orcamentos_repository.table_name == 'orcamentos'


def test_r2_url_publica_e_flag():
    from api.services.upload_services import UploadServices

    sem_r2 = UploadServices()
    assert sem_r2.r2_configurado is False
    com_r2 = UploadServices(
        r2_account_id='abc123',
        r2_access_key_id='key',
        r2_secret_access_key='secret',
        r2_bucket='landingpage',
        r2_public_url='https://img.exemplo.com/',
    )
    assert com_r2.r2_configurado is True
    assert (
        com_r2.url_publica_r2('landing/foto.png')
        == 'https://img.exemplo.com/landing/foto.png'
    )


def test_openapi_tem_rotas_core():
    c = TestClient(app)
    spec = c.get('/openapi.json').json()['paths']
    for esperada in (
        '/orcamentos/',
        '/orcamentos/{oid}',
        '/login',
        '/refresh',
        '/logout',
        '/admins/seed',
        '/conteudo',
        '/conteudo/site',
        '/conteudo/projetos',
        '/conteudo/depoimentos',
        '/upload',
        '/health',
    ):
        assert esperada in spec, f'falta {esperada}'
    for removida in (
        '/produtos',
        '/pedidos',
        '/pagamento/webhook',
        '/frete/cotar',
        '/push/subscribe',
        '/cliente',
        '/usuarios',
    ):
        assert removida not in spec, f'sobrou {removida}'
