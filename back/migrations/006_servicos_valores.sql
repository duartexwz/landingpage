-- 006_servicos_valores.sql — novos serviços e faixas de valor (idempotente).
-- Serviços: separa Landing Pages de Web Apps; remove Identidade Visual e Ilustração autoral.
-- Valores: APIs R$ 2k-3,5k | Landing R$ 800-1k | Web Apps R$ 3k-5k | Automações R$ 3k-6k.

-- 1. Migra linhas antigas para os novos valores válidos
UPDATE orcamentos SET tipo_projeto = 'Web Apps'
  WHERE tipo_projeto = 'Landing Pages & Web Apps';
UPDATE orcamentos SET tipo_projeto = 'Outro'
  WHERE tipo_projeto IN ('Identidade Visual', 'Ilustração autoral');

UPDATE orcamentos SET orcamento_estimado = 'R$ 3k - 5k'
  WHERE orcamento_estimado = 'R$ 2k - 5k';
UPDATE orcamentos SET orcamento_estimado = 'R$ 3k - 6k'
  WHERE orcamento_estimado = 'R$ 5k - 15k';
UPDATE orcamentos SET orcamento_estimado = 'Ainda não sei (sob consulta)'
  WHERE orcamento_estimado IN ('R$ 15k - 30k', 'R$ 30k+');

-- 2. Troca os CHECKs (nomes padrão do Postgres para CHECK inline)
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_tipo_projeto_check;
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_orcamento_estimado_check;

ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_tipo_projeto_check
  CHECK (tipo_projeto IN (
    'Desenvolvimento de APIs', 'Landing Pages', 'Web Apps',
    'Automações de Processos', 'Outro'));

ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_orcamento_estimado_check
  CHECK (orcamento_estimado IN (
    'R$ 800 - 1k', 'R$ 2k - 3,5k', 'R$ 3k - 5k', 'R$ 3k - 6k',
    'Ainda não sei (sob consulta)'));

-- 3. Novos defaults
ALTER TABLE orcamentos ALTER COLUMN tipo_projeto SET DEFAULT 'Desenvolvimento de APIs';
ALTER TABLE orcamentos ALTER COLUMN orcamento_estimado SET DEFAULT 'Ainda não sei (sob consulta)';
