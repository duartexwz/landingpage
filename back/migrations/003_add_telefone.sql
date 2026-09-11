-- 003_add_telefone.sql — telefone do interessado em orcamentos (idempotente).
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS telefone TEXT
  CHECK (char_length(telefone) <= 20);
