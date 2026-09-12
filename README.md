# mayckon.dev — Landing Page + API + Painel Admin

Landing page dark de alta conversão para serviços de **APIs, Landing Pages, Web Apps e Automações**,
com formulário de orçamento, painel administrativo e conteúdo editável pelo painel.

## Stack

| Camada | Tecnologia |
|---|---|
| Front | React 18 + Vite 5 + CSS puro (sem dependências extras) |
| Back | FastAPI + psycopg 3 (sync) + PyJWT + Argon2 (pwdlib) |
| Banco | PostgreSQL 16 (local via Docker, produção no Neon) |
| Deploy | Vercel (front estático + função Python) |
| Uploads | Disco local (dev/docker) · Vercel Blob (produção) |

## Estrutura

```
.
├── api/index.py            # entry-point do backend na Vercel (reaproveita back/)
├── vercel.json             # build do front + rewrites /api e /uploads -> função Python
├── docker-compose.yml      # db (5434) + backend (8000) + front (80)
├── requirements.txt        # deps Python usadas pela Vercel (espelha back/pyproject.toml)
├── .env                    # variáveis locais (GITIGNORADO — nunca commitar)
├── back/
│   ├── api/                # app, routers, services, repositories, schemas, settings
│   ├── schema.sql          # schema canônico (7 tabelas + seeds)
│   ├── migrations/         # 001_init … 006_servicos_valores (idempotentes)
│   ├── migrate.py          # aplica schema.sql ou migrations/*.sql (Neon-safe, SSL)
│   ├── Dockerfile
│   └── tests/              # pytest: schemas, JWT, services, OpenAPI
├── front/
│   ├── src/App.jsx         # landing completa · src/Admin.jsx → painel /admin
│   ├── nginx.conf          # SPA + proxy /api e /uploads -> backend (docker)
│   └── Dockerfile          # build Vite + serve via nginx
├── docs/ARQUITETURA.md     # detalhamento técnico (banco, backend, front)
└── prototipagem-tela/      # prints de referência do layout
```

## Serviços, tipos e faixas

| Serviço | Faixa exibida |
|---|---|
| Desenvolvimento de APIs | R$ 2k – R$ 3,5k |
| Landing Pages | R$ 800 – R$ 1k |
| Web Apps | R$ 3k – R$ 5k |
| Automações de Processos | R$ 3k – R$ 6k |

Tipos aceitos no formulário (`tipo_projeto`): `Desenvolvimento de APIs`, `Landing Pages`,
`Web Apps`, `Automações de Processos`, `Outro`.
Ao trocar o tipo, o campo de orçamento preenche a faixa correspondente automaticamente.
Faixas aceitas (`orcamento_estimado`): `R$ 800 - 1k`, `R$ 2k - 3,5k`, `R$ 3k - 5k`,
`R$ 3k - 6k`, `Ainda não sei (sob consulta)`.

## Rodar local

```bash
# tudo junto (banco + API + front)
docker compose up --build -d
docker compose logs -f backend

# só o front (com proxy /api -> localhost:8000)
cd front && npm install && npm run dev   # http://localhost:5173

# só os testes do backend
python3 -m pytest back/tests/test_core.py -q
```

Front: http://localhost (porta 80 no compose) · API: http://localhost:8000 · Docs: /docs.

## Variáveis de ambiente

O backend lê `/.env` (raiz) e `back/.env`. Modelo em `back/.env.example`.
Na Vercel, cadastre as mesmas chaves em Project Settings → Environment Variables.

| Chave | Uso |
|---|---|
| `APP_NAME` | Nome exibido na API |
| `ENV` | `dev` local · `prod` na Vercel (CORS restrito em prod) |
| `DATABASE_URL` | Local: `postgresql://postgres:postgres@localhost:5434/landingpage?sslmode=disable` · Neon: `postgresql://<user>:<senha>@<host>.neon.tech/<db>?sslmode=require` |
| `JWT_SECRET` | Segredo do JWT (gerar novo p/ produção: `openssl rand -hex 32`) |
| `JWT_ALG` / `ACCESS_TOKEN_MINUTES` / `REFRESH_TOKEN_DAYS` | `HS256` · access 60min · refresh 7 dias |
| `CORS_ORIGINS` | Origens liberadas (em prod, incluir o domínio da Vercel) |
| `SEED_ADMIN_NOME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_SENHA` | Admin criado via `POST /admins/seed` |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob — sem ele, uploads somem a cada deploy em produção |
| `R2_ACCOUNT_ID` / `R2_BUCKET` | Conta e bucket do Cloudflare R2 (`landingpage`) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Token R2 (Object Read & Write) — sem eles o upload cai p/ disco local |
| `R2_PUBLIC_URL` | Domínio público do bucket (Custom Domain ou r2.dev) — base das URLs salvas |
| `VITE_API_URL` (front) | Vazio = mesma origem (`/api`). Só definir se a API estiver noutra URL |

## Banco e migrations

Tabelas: `admins`, `orcamentos`, `consentimentos`, `refresh_tokens`, `site_config`,
`projetos`, `depoimentos`. Seeds: bio, foto, 3 projetos e 3 depoimentos.

```bash
# banco novo: aplica o schema canônico
DATABASE_URL=... python3 back/migrate.py
# banco existente: aplica as migrations em ordem
DATABASE_URL=... python3 back/migrate.py --migrations
# cria o admin inicial (idempotente)
curl -X POST https://<sua-api>/admins/seed
```

Migrations: `001_init`, `002_cleanup_ecommerce`, `003_add_telefone`,
`004_conteudo_site`, `005_projeto_detalhes`, `006_servicos_valores`.

## Painel /admin

Rota `/admin`: login JWT → abas **Orçamentos** (leads, filtros, status, WhatsApp do
cliente, excluir) e **Editar landing** (bio, foto, projetos com capa + galeria + case
completo, depoimentos com aprovação de feedbacks). Exclusão de projeto usa modal de
confirmação estilizada (sem `confirm()` nativo).
Obs: `GET /api/conteudo` tem cache de borda (60s) + cache local com revalidação —
edições no painel refletem no site em até ~1 minuto.

## Rotas da API

| Método | Rota | Acesso |
|---|---|---|
| POST | `/login`, `/refresh`, `/logout` | público |
| GET | `/me`, `/health` | admin / público |
| POST | `/admins/seed` | público (usar 1x e proteger) |
| POST | `/orcamentos` | público (anti-duplicado 24h) |
| GET | `/orcamentos?status&busca` | admin |
| GET/PATCH/DELETE | `/orcamentos/{id}` | admin |
| GET | `/conteudo` | público (bio, foto, projetos e depoimentos ativos) |
| PUT | `/conteudo/site` | admin |
| GET/POST/PATCH/DELETE | `/conteudo/projetos`, `/conteudo/depoimentos` (+ `/{id}`) | admin |
| POST | `/conteudo/depoimentos/enviar` | público (entra pendente p/ aprovação) |
| POST | `/upload` | admin (imagens até 5MB, validação por assinatura) |

## Uploads (Cloudflare R2)

`POST /upload` envia para o R2 (prefixo `landing/`) quando as chaves estão
configuradas; sem elas, cai para Vercel Blob e depois disco local.

1. Cloudflare → R2 → **Manage R2 API Tokens** → Create (permissão **Object Read & Write**, bucket `landingpage`).
2. Ative o acesso público do bucket: **Custom Domain** (recomendado) ou **Public r2.dev**.
3. Preencha `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_PUBLIC_URL` no `.env` e nas env vars da Vercel.

## Deploy em produção (Vercel + Neon)

1. Crie o banco no Neon e aplique schema + migrations (seção acima).
2. Conecte o repo na Vercel (build e rewrites já configurados no `vercel.json`).
3. Cadastre as env vars (tabela acima), com `ENV=prod`, `DATABASE_URL` do Neon,
   `CORS_ORIGINS` incluindo o domínio, `JWT_SECRET` novo e `BLOB_READ_WRITE_TOKEN`.
4. Deploy → `POST /admins/seed` → login em `/admin` → confira `/health`.
5. Pós-deploy: troque `SEED_ADMIN_SENHA`, proteja ou remova `/admins/seed`,
   teste formulário, upload e o fallback da landing com a API fora.

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| Front não fala com a API em prod | `CORS_ORIGINS` sem o domínio da Vercel |
| Uploads somem após deploy | `BLOB_READ_WRITE_TOKEN` ausente (disco efêmero) |
| Foto de perfil quebrada | Defina a foto pelo painel (o fallback agora vai embutido no build) |
| 401 no painel | Token expirado — o front tenta refresh; se persistir, faça login de novo |
| Erro de CHECK no banco antigo | Rode `migrate.py --migrations` (006 alinha tipos e faixas) |
| Página dá 404 na Vercel sem logs | O request nem chegou ao deploy: confira Root Directory (`./`), Framework Preset (`Other`) e Production Branch (`master`) nas Settings; redeploy limpo se o deploy for anterior aos rewrites |

© 2026 mayckon.dev — Todos os direitos reservados.
