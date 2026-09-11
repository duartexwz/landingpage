-- 005_projeto_detalhes.sql — case completo do projeto (idempotente).
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS capa_url TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS imagens JSONB NOT NULL DEFAULT '[]';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS como_foi_feito TEXT NOT NULL DEFAULT '';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS estrutura_pastas TEXT NOT NULL DEFAULT '';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS linguagens TEXT NOT NULL DEFAULT '';
