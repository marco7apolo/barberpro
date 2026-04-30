-- =====================================================
-- BarberPro - Preservar dados ao excluir barbeiros
-- Executar no: Supabase -> SQL Editor -> New Query -> Run
-- =====================================================

-- 1. Drop existing FK constraints that cascade
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_barbeiro_id_fkey;
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_cliente_id_fkey;
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_servico_id_fkey;
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_agendamento_id_fkey;

-- 2. Re-add with SET NULL to preserve historical data
ALTER TABLE agendamentos
  ADD CONSTRAINT agendamentos_barbeiro_id_fkey
  FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id) ON DELETE SET NULL;

ALTER TABLE agendamentos
  ADD CONSTRAINT agendamentos_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;

ALTER TABLE agendamentos
  ADD CONSTRAINT agendamentos_servico_id_fkey
  FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE SET NULL;

ALTER TABLE transacoes
  ADD CONSTRAINT transacoes_agendamento_id_fkey
  FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL;

-- 3. Add columns to barbeiros and clientes for audit tracking
--    These track WHO deleted the record and WHEN
ALTER TABLE barbeiros ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE barbeiros ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES perfis(id);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES perfis(id);
