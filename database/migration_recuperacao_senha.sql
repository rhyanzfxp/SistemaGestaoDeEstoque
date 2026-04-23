-- Migration: Tabela de tokens de recuperação de senha
-- Requisitos: 1.3, 3.1, 3.6

CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  hash_token  VARCHAR(64) NOT NULL,        -- SHA-256 em hex (64 chars)
  usado       BOOLEAN NOT NULL DEFAULT false,
  criado_em   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expira_em   TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT uq_hash_token UNIQUE (hash_token)
);

CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens_recuperacao_senha(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens_recuperacao_senha(hash_token);

ALTER TABLE tokens_recuperacao_senha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações para service_role" ON tokens_recuperacao_senha FOR ALL USING (auth.role() = 'service_role');
