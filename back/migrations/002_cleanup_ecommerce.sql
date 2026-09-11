-- 002_cleanup_ecommerce.sql — remove tabelas do modelo antigo (e-commerce),
-- fora do escopo (só orçamentos + login). Idempotente.
DROP TABLE IF EXISTS rastreio_eventos CASCADE;
DROP TABLE IF EXISTS itens_pedido CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS pagamento_webhooks CASCADE;
DROP TABLE IF EXISTS frete_cotacoes CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS enderecos CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS oauth_tokens CASCADE;
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DO $$ BEGIN DROP TYPE IF EXISTS status_pedido; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS status_pagamento; EXCEPTION WHEN others THEN NULL; END $$;
