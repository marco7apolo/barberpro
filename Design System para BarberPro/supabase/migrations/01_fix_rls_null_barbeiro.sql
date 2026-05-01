-- Drop e recriar a policy de leitura para incluir barbeiro_id IS NULL
DROP POLICY IF EXISTS agendamentos_read ON agendamentos;
CREATE POLICY agendamentos_read ON agendamentos FOR SELECT
  USING (
    barbeiro_id IS NULL
    OR EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin')
    OR barbeiro_id IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  );

-- Drop e recriar a policy de escrita para permitir atualizacao mesmo quando barbeiro_id muda
DROP POLICY IF EXISTS agendamentos_write ON agendamentos;
CREATE POLICY agendamentos_write ON agendamentos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'atendente'))
    OR barbeiro_id IS NULL
    OR barbeiro_id IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'atendente'))
    OR barbeiro_id IS NULL
    OR barbeiro_id IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  );
