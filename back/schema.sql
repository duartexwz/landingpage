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
      'Desenvolvimento de APIs','Landing Pages','Web Apps',
      'Automações de Processos','Outro')),
  orcamento_estimado TEXT NOT NULL DEFAULT 'Ainda não sei (sob consulta)'
    CHECK (orcamento_estimado IN (
      'R$ 800 - 1k','R$ 2k - 3,5k','R$ 3k - 5k','R$ 3k - 6k',
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

-- Evolução: detalhes do case do projeto (bancos criados antes destas colunas)
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS capa_url TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS imagens JSONB NOT NULL DEFAULT '[]';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS como_foi_feito TEXT NOT NULL DEFAULT '';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS estrutura_pastas TEXT NOT NULL DEFAULT '';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS linguagens TEXT NOT NULL DEFAULT '';

-- ---------- 5. CONTEÚDO EDITÁVEL DA LANDING ----------
CREATE TABLE IF NOT EXISTS site_config (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  problema TEXT NOT NULL DEFAULT '',
  solucao TEXT NOT NULL DEFAULT '',
  imagem_url TEXT,
  link_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS depoimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texto TEXT NOT NULL,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_proj ON projetos;
CREATE TRIGGER trg_proj BEFORE UPDATE ON projetos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
DROP TRIGGER IF EXISTS trg_dep ON depoimentos;
CREATE TRIGGER trg_dep BEFORE UPDATE ON depoimentos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Seeds (só se vazio — espelham o conteúdo original da landing)
INSERT INTO site_config (chave, valor) VALUES
  ('bio', '{"titulo": "Lógica de engenharia,\nresultado de negócio.", "texto": "Acredito que todo processo repetitivo é um sistema esperando ser construído. Uso Python e arquitetura limpa para transformar dor operacional em software que escala — com medição, teste e deploy sem surpresas.", "sub": "Eficiência operacional através de automações, integrações e infraestrutura para operações que não podem parar."}'::jsonb),
  ('foto_url', '"/src/assets/WhatsApp Image 2026-08-29 at 15.46.44.jpeg"'::jsonb)
ON CONFLICT (chave) DO NOTHING;

INSERT INTO projetos (titulo, problema, solucao, imagem_url, ordem)
SELECT * FROM (VALUES
  ('Sistema de agendamento de eventos', 'marcação de eventos sem organização, com falta de planejamento e mais.', 'sistema de agendamento externo e interno, com painel de controle, cadastro de usuarios, acompanhamento de solicitação, etc..', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60', 1),
  ('Loja de Vendas Online', 'vendas por whatsapp, alta demanda de atendimento e entrega.', 'Sistema de compras online, com pagamento confiável pelo Mercado Pago, gestão de pedidos, produtos e entregas.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60', 2),
  ('Landing de Captação', 'conversão baixa.', 'página rápida que dobrou leads qualificados.', '', 3)
) AS v(titulo, problema, solucao, imagem_url, ordem)
WHERE NOT EXISTS (SELECT 1 FROM projetos);

INSERT INTO depoimentos (texto, nome, cargo, avatar_url, ordem)
SELECT * FROM (VALUES
  ('O painel reduziu 90% do nosso trabalho manual de fechamento. Roda sozinho.', 'Marina Costa', 'COO · Vetor Log', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60', 1),
  ('API enxuta e documentada. Integração levou dias, não meses.', 'Diego Ramos', 'Head de Produto · Nuvem', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60', 2),
  ('A landing dobrou nossos leads qualificados na primeira quinzena.', 'Paula Menezes', 'Fundadora · Karta', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60', 3)
) AS v(texto, nome, cargo, avatar_url, ordem)
WHERE NOT EXISTS (SELECT 1 FROM depoimentos);
