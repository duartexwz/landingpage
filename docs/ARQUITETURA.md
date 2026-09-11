# Documentação do projeto — landing mayckon.dev + API + Postgres

Escopo final: **formulário de orçamento + painel admin (leads + editar landing)**.

## 1. Banco (`back/schema.sql`) — 7 tabelas

| Tabela | Papel | Colunas-chave / relacionamentos |
|---|---|---|
| `admins` | login do painel `/admin` | `email CITEXT UNIQUE`, `senha_hash` (Argon2), `ativo` |
| `orcamentos` | **leads do formulário** (nome, e-mail, telefone/whatsapp, tipo_projeto, orcamento_estimado, mensagem) | `status` (novo→em_atendimento→convertido→arquivado), `origem`, `lido`, `consent_lgpd`, `ip`, `user_agent` |
| `consentimentos` | trilha LGPD | `email → finalidade, aceito, ip` |
| `refresh_tokens` | refresh JWT 7 dias | `admin_id → admins.id (CASCADE)`, `jti UNIQUE`, `revogado` |
| `site_config` | bio + foto (`chave → valor JSONB`) | `bio{titulo,texto,sub}`, `foto_url` (seeds inclusos) |
| `projetos` | portfólio + case completo | `titulo, problema, solucao, capa_url (card), imagens[] (galeria), link_url, como_foi_feito, estrutura_pastas, linguagens, ordem, ativo` (3 seeds) |
| `depoimentos` | feedbacks editáveis | `texto, nome, cargo, avatar_url, ordem, ativo` (3 seeds) |

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

**Rotas (17 paths):** `POST /login|/refresh|/logout`, `GET /me`, `POST /admins/seed`,
`POST /orcamentos` (público, 409 anti-duplicado 24h, 422 validação), `GET /orcamentos?status&busca`,
`GET/PATCH/DELETE /orcamentos/{id}` (admin, 401 sem Bearer),
`GET /conteudo` (público — bio, foto, projetos e depoimentos ativos),
`PUT /conteudo/site` + CRUD `/conteudo/projetos` + CRUD `/conteudo/depoimentos` (admin),
`POST /conteudo/depoimentos/enviar` (público — feedback entra pendente `ativo=false`,
só aparece no site após Aprovar no painel),
`POST /upload` (admin, só imagens png/jpg/webp/gif até 5MB, validação por assinatura,
servidas em `/uploads/*` via volume `uploads:` — sem URL manual, o painel envia o arquivo).

## 3. Front / painel

`src/lib/api.js` → `/api/*`; `App.jsx` POST do form + carrega `/api/conteudo`
(portfólio, bio, foto e depoimentos dinâmicos, com fallback embutido se a API cair).
`/admin` → `Admin.jsx` com abas: **💰 Orçamentos** (lista, filtros, WhatsApp do cliente,
PATCH, DELETE) e **✏️ Editar landing** (bio, foto com upload, projetos com capa + galeria
múltipla + como-foi-feito + estrutura + linguagens + link, feedbacks). A landing abre o
**case completo** em modal (galeria, chips de linguagens, README, estrutura, link).
FAQ atualizado: PostgreSQL, Python, FastAPI, HTML, CSS, JS, React — infra Vercel.
Vite proxy `/api→:8000`; `nginx.conf` (`/api/` e `/uploads/` → backend, fallback SPA);
compose `front :80 → backend :8000 → db :5434`; `vercel.json` com rewrites;
`.env` real na **raiz** (gitignorado via `/.gitignore`).

## 4. Erros corrigidos nesta revisão

1. Modelo e-commerce inteiro removido (routers, services, schemas, tabelas via migração 002).
2. `get_conn` renomeado para `get_db` (padrão das imagens) — corrigidos todos os imports.
3. `migrate.py` ignorava `\i` (001 era no-op) — agora expande includes.
4. Rotas com `prefix` precisavam de `''` + `'/'` (front chama sem barra final) — ambos registrados.
5. Conta de teste `admin@mayckon.dev` (senha conhecida) removida do banco; mantido só o admin real.
