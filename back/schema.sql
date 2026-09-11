-- ============================================================
-- LandingPage mayckon.dev — schema.sql (Postgres / Neon)
-- Escopo: formulário de orçamento (nome, e-mail, tipo_projeto,
-- orcamento_estimado, mensagem) + painel admin com login.
-- Tabelas: admins, orcamentos, consentimentos, refresh_tokens.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------- ENUM ----------
DO $$ BEGIN CREATE TYPE status_orcamento AS ENUM
  ('novo','em_atendimento','convertido','arquivado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 1. ADMINS (login do painel /admin) ----------
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 2. ORÇAMENTOS (leads do formulário) ----------
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  tipo_projeto TEXT NOT NULL DEFAULT 'Desenvolvimento de APIs'
    CHECK (tipo_projeto IN (
      'Desenvolvimento de APIs','Automações de Processos',
      'Landing Pages & Web Apps','Identidade Visual',
      'Ilustração autoral','Outro')),
  orcamento_estimado TEXT NOT NULL DEFAULT 'R$ 5k - 15k'
    CHECK (orcamento_estimado IN (
      'R$ 2k - 5k','R$ 5k - 15k','R$ 15k - 30k','R$ 30k+',
      'Ainda não sei (sob consulta)')),
  mensagem TEXT NOT NULL CHECK (char_length(mensagem) BETWEEN 10 AND 5000),
  telefone TEXT CHECK (char_length(telefone) <= 20),
  status status_orcamento NOT NULL DEFAULT 'novo',
  origem TEXT NOT NULL DEFAULT 'site' CHECK (origem IN ('site','whatsapp','admin')),
  lido BOOLEAN NOT NULL DEFAULT FALSE,
  consent_lgpd BOOLEAN NOT NULL DEFAULT TRUE,
  ip TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_email ON orcamentos(email);
CREATE INDEX IF NOT EXISTS idx_orcamentos_criado ON orcamentos(criado_em DESC);

-- ---------- 3. CONSENTIMENTOS LGPD ----------
CREATE TABLE IF NOT EXISTS consentimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  finalidade TEXT NOT NULL DEFAULT 'contato_orcamento',
  aceito BOOLEAN NOT NULL DEFAULT TRUE,
  ip TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_email ON consentimentos(email);

-- ---------- 4. REFRESH TOKENS (JWT refresh 7 dias) ----------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  jti TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMPTZ NOT NULL,
  revogado BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_admin ON refresh_tokens(admin_id);

-- ---------- TRIGGER atualizado_em ----------
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$ BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admins ON admins;
CREATE TRIGGER trg_admins BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
DROP TRIGGER IF EXISTS trg_orc ON orcamentos;
CREATE TRIGGER trg_orc BEFORE UPDATE ON orcamentos FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Evolução: telefone do interessado (bancos criados antes desta coluna)
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS telefone TEXT
  CHECK (char_length(telefone) <= 20);
