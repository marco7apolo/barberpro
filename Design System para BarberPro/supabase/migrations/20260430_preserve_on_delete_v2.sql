-- =====================================================
-- BarberPro - Preservar dados ao excluir barbeiros (v2)
-- Executar no: Supabase -> SQL Editor -> New Query -> Run
-- =====================================================

-- 1. Drop existing FK constraints by finding them dynamically
-- agendamentos -> barbeiros
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'agendamentos'::regclass
    AND contype = 'f'
    AND conkey::text[] && ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'agendamentos'::regclass AND attname = 'barbeiro_id')]::text[];
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE agendamentos DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- agendamentos -> clientes
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'agendamentos'::regclass
    AND contype = 'f'
    AND conkey::text[] && ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'agendamentos'::regclass AND attname = 'cliente_id')]::text[];
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE agendamentos DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- agendamentos -> servicos
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'agendamentos'::regclass
    AND contype = 'f'
    AND conkey::text[] && ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'agendamentos'::regclass AND attname = 'servico_id')]::text[];
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE agendamentos DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- transacoes -> agendamentos
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'transacoes'::regclass
    AND contype = 'f'
    AND conkey::text[] && ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'transacoes'::regclass AND attname = 'agendamento_id')]::text[];
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE transacoes DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- 2. Re-add with SET NULL
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

-- 3. Verify constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('agendamentos', 'transacoes')
  AND tc.constraint_type = 'FOREIGN KEY';
