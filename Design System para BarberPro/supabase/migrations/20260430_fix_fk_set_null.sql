-- 1. Encontrar e dropar a FK de barbeiros em agendamentos
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'agendamentos'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'agendamentos'::regclass AND attname = 'barbeiro_id')
    ];
  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE agendamentos DROP CONSTRAINT ' || quote_ident(fk_name);
    RAISE NOTICE 'Dropped constraint: %', fk_name;
  ELSE
    RAISE NOTICE 'No FK constraint found on barbeiro_id';
  END IF;
END $$;

ALTER TABLE agendamentos
  ADD CONSTRAINT agendamentos_barbeiro_id_fkey
  FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id) ON DELETE SET NULL;

-- 2. Encontrar e dropar a FK de clientes em agendamentos
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'agendamentos'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'agendamentos'::regclass AND attname = 'cliente_id')
    ];
  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE agendamentos DROP CONSTRAINT ' || quote_ident(fk_name);
    RAISE NOTICE 'Dropped constraint: %', fk_name;
  ELSE
    RAISE NOTICE 'No FK constraint found on cliente_id';
  END IF;
END $$;

ALTER TABLE agendamentos
  ADD CONSTRAINT agendamentos_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;

-- 3. Encontrar e dropar a FK de agendamentos em transacoes
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'transacoes'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'transacoes'::regclass AND attname = 'agendamento_id')
    ];
  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE transacoes DROP CONSTRAINT ' || quote_ident(fk_name);
    RAISE NOTICE 'Dropped constraint: %', fk_name;
  ELSE
    RAISE NOTICE 'No FK constraint found on agendamento_id';
  END IF;
END $$;

ALTER TABLE transacoes
  ADD CONSTRAINT transacoes_agendamento_id_fkey
  FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL;

-- 4. Verificar o resultado
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('agendamentos', 'transacoes')
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('barbeiro_id', 'cliente_id', 'agendamento_id');
