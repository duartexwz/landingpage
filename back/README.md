# Backend — mayckon.dev API (FastAPI + Postgres/Neon)

Escopo: **formulário de orçamento + painel admin**. Sem e-commerce
(sem frete, clientes, pedidos, pagamentos).

## Arquitetura (Router → Service → Repository)

```
back/
├── schema.sql        # 4 tabelas: admins, orcamentos, consentimentos, refresh_tokens
├── migrate.py        # aplica schema.sql / migrations/*.sql (Neon-safe, expande \i)
├── migrations/       # 001_init.sql, 002_cleanup_ecommerce.sql
├── Dockerfile
├── .env.example      # modelo (o real fica na RAIZ: /.env, gitignorado)
└── api/
    ├── app.py            # FastAPI + CORS + strip /api + lifespan sem pool
    ├── database.py       # get_db: 1 conexão por requisição + kwargs Neon
    ├── settings.py       # lê /.env (raiz) e back/.env
    ├── security.py       # JWT+Argon2, get_current_user, refresh 7 dias
    ├── schemas/          # orcamento, auth, enums (Operador), global_schemas
    ├── repositories/     # sql_repository (QueryRepository base), orcamentos, admins
    ├── services/         # orcamentos_services, auth_services
    └── routers/          # login, admins, orcamentos
```

## Rodar local (tudo junto no compose)

```bash
docker compose up --build -d   # db :5434, backend :8000, front :80
docker compose logs -f backend # logs só da API
docker compose logs -f front   # logs só do front
docker compose logs -f db      # logs só do banco
```

O backend roda `migrate.py` no boot (cria as 4 tabelas). Depois:

```bash
curl -X POST localhost:8000/admins/seed   # cria o admin do /.env
# abra http://localhost/admin e faça login
```

Ou só a API sem docker:

```bash
cd back && python migrate.py && uvicorn api.app:app --port 8000
```

Docs: http://localhost:8000/docs · Health: `/health`

## Painel /admin

Usuário: `mayckonkennedy877@gmail.com` (senha no `/.env` → `SEED_ADMIN_SENHA`).
Em banco novo rode `POST /admins/seed` para criar o admin a partir do `.env`.

## Rotas

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/login` | — | login → access (60min) + refresh (7 dias) |
| POST | `/refresh` | — | rotaciona refresh |
| POST | `/logout` | — | revoga refresh |
| GET | `/me` | — | ajuda do Bearer |
| POST | `/admins/seed` | — | cria admin de `SEED_ADMIN_*` (idempotente) |
| POST | `/orcamentos` (+ `/`) | — | **enviar orçamento (form público)**; 409 se duplicado em 24h |
| GET | `/orcamentos` | admin | listar (filtros `status`, `busca`) |
| GET/PATCH/DELETE | `/orcamentos/{id}` | admin | detalhe, `status`/`lido`, excluir |

Testes: `cd back && python -m pytest tests/ -q` (6 testes, sem banco).
