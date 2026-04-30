ALTER TABLE barbeiros DROP CONSTRAINT IF EXISTS barbeiros_cpf_key;
ALTER TABLE barbeiros DROP CONSTRAINT IF EXISTS barbeiros_cpf_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_barbeiros_cpf_active ON barbeiros(cpf) WHERE ativo = true;
ALTER TABLE barbeiros DROP CONSTRAINT IF EXISTS barbeiros_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_barbeiros_email_active ON barbeiros(email) WHERE ativo = true AND email IS NOT NULL;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cpf_key;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cpf_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf_active ON clientes(cpf) WHERE ativo = true AND cpf IS NOT NULL;
