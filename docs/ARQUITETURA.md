# Documentação do projeto — landing mayckon.dev + API + Postgres

Escopo final: **formulário de orçamento + painel admin** (e-commerce removido).

## 1. Banco (`back/schema.sql`) — 4 tabelas

| Tabela | Papel | Colunas-chave / relacionamentos |
|---|---|---|
| `admins` | login do painel `/admin` | `email CITEXT UNIQUE`, `senha_hash` (Argon2), `ativo` |
| `orcamentos` | **leads do formulário** (nome, e-mail, telefone/whatsapp, tipo_projeto, orcamento_estimado, mensagem) | `status` (novo→em_atendimento→convertido→arquivado), `origem`, `lido`, `consent_lgpd`, `ip`, `user_agent` |
| `consentimentos` | trilha LGPD | `email → finalidade, aceito, ip` |
| `refresh_tokens` | refresh JWT 7 dias | `admin_id → admins.id (CASCADE)`, `jti UNIQUE`, `revogado` |

`migrations/002_cleanup_ecommerce.sql` removeu as tabelas do modelo antigo.
`migrate.py` aplica schema/migrations com 1 conexão curta SSL (expande `\i`).

**Acessos.** Local: serviço `db` do `docker-compose.backend.yml`
(Postgres 16, porta **5434** no host): usuário `postgres` · senha `postgres` · db `landingpage`.
Nenhuma dependência do banco `loja_online` — projeto 100% isolado.
Admin do painel: `mayckonkennedy877@gmail.com` / senha `Mk@220525` (hash Argon2 no banco).
Produção (Neon via Vercel): credenciais geradas no painel Neon → `DATABASE_URL` nas envs da Vercel.

## 2. Backend — Router → Service → Repository

**Ferramentas:** FastAPI/uvicorn, psycopg 3 sync (`get_db`, 1 conexão/request, `sslmode=require`),
pydantic-settings (lê `/.env` da raiz), PyJWT, pwdlib+Argon2, email-validator.

- `routers/` — fino: valida auth (`get_current_user`), chama a classe de serviço.
- `services/` — regra de negócio (`OrcamentosServices`, `AuthServices`).
- `repositories/` — SQL (`QueryRepository` base com `table_name/campos/mapa_filtros/existe`, mais `OrcamentosRepository` e `AdminsRepository`).

**Rotas (8 paths):** `POST /login|/refresh|/logout`, `GET /me`, `POST /admins/seed`,
`POST /orcamentos` (público, 409 anti-duplicado 24h, 422 validação), `GET /orcamentos?status&busca`,
`GET/PATCH/DELETE /orcamentos/{id}` (admin, 401 sem Bearer).

## 3. Front / deploy (inalterado)

`src/lib/api.js` → `/api/orcamentos`; `App.jsx` POST real; `/admin` → `Admin.jsx`
(login + refresh automático + filtros + PATCH + DELETE). Vite proxy `/api→:8000`;
`nginx.conf` (`/api/→backend:8000`, fallback SPA); portas dev `5173/8000`,
compose `front :80 → backend :8000 → db :5434`;
`vercel.json` com rewrites. `.env` real na **raiz** (gitignorado via `/.gitignore`).

## 4. Erros corrigidos nesta revisão

1. Modelo e-commerce inteiro removido (routers, services, schemas, tabelas via migração 002).
2. `get_conn` renomeado para `get_db` (padrão das imagens) — corrigidos todos os imports.
3. `migrate.py` ignorava `\i` (001 era no-op) — agora expande includes.
4. Rotas com `prefix` precisavam de `''` + `'/'` (front chama sem barra final) — ambos registrados.
5. Conta de teste `admin@mayckon.dev` (senha conhecida) removida do banco; mantido só o admin real.
