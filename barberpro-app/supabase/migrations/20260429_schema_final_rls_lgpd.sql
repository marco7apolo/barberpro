-- =====================================================
-- BarberPro - Schema Final + RLS + LGPD (Corrigido)
-- Executar no: Supabase -> SQL Editor -> New Query -> Run
-- =====================================================

-- Habilitar extensoes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- TABELA: perfis
-- =====================================================
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  cargo TEXT CHECK (cargo IN ('admin', 'barbeiro', 'atendente')),
  barbearia_id UUID,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_cargo ON perfis(cargo) WHERE ativo = true;

-- =====================================================
-- TABELA: barbeiros
-- =====================================================
CREATE TABLE IF NOT EXISTS barbeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  nome_exibicao TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT UNIQUE,
  foto_url TEXT,
  especialidades TEXT[] DEFAULT ARRAY['corte', 'barba'],
  comissao_percent DECIMAL(5,2) DEFAULT 10.00,
  valor_minimo_servico DECIMAL(10,2) DEFAULT 0.00,
  agenda_config JSONB DEFAULT '{"segunda":{"inicio":"09:00","fim":"18:00"}}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barbeiros_cpf ON barbeiros(cpf);

-- =====================================================
-- TABELA: clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  data_nascimento DATE,
  observacoes TEXT,
  preferencias JSONB DEFAULT '{}',
  consentimento_lgpd JSONB DEFAULT '{"promocoes_whatsapp":false,"historico_servicos":true}',
  criado_por UUID REFERENCES barbeiros(id) ON DELETE SET NULL,
  indicado_por UUID REFERENCES clientes(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);

-- =====================================================
-- TABELA: categorias_servicos
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor_badge TEXT DEFAULT '#ffd700',
  ordem_exibicao INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categorias_servicos (nome, descricao, cor_badge, ordem_exibicao)
VALUES
  ('Cortes', 'Servicos de corte de cabelo', '#3b82f6', 1),
  ('Barba', 'Barba completa, modelagem', '#ef4444', 2),
  ('Sobrancelha', 'Design e limpeza', '#22c55e', 3),
  ('Estetica', 'Hidratacao e tratamentos', '#a855f7', 4),
  ('Combo', 'Pacotes promocionais', '#f59e0b', 5)
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- TABELA: servicos
-- =====================================================
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES categorias_servicos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
  preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
  preco_promocional DECIMAL(10,2),
  buffer_minutos INTEGER DEFAULT 5 CHECK (buffer_minutos >= 0),
  combinavel_com UUID[],
  disponivel_online BOOLEAN DEFAULT true,
  visivel_cliente BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT servicos_nome_unique UNIQUE (nome)
);

CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria_id) WHERE ativo = true;

INSERT INTO servicos (categoria_id, nome, descricao, duracao_minutos, preco, buffer_minutos)
SELECT
  c.id, s.nome, s.descricao, s.duracao, s.preco, s.buffer
FROM (
  VALUES
    ('Cortes', 'Corte Social', 'Corte tradicional na tesoura ou maquina', 30, 40.00, 5),
    ('Cortes', 'Corte Degrade', 'Degrade com acabamento na navalha', 45, 55.00, 10),
    ('Cortes', 'Corte Infantil', 'Para criancas ate 10 anos', 25, 35.00, 5),
    ('Barba', 'Barba Completa', 'Modelagem completa com toalha quente', 30, 45.00, 5),
    ('Barba', 'So Acabamento', 'Ajuste de contorno e finalizacao', 15, 25.00, 0),
    ('Combo', 'Corte + Barba', 'Pacote completo com desconto', 60, 80.00, 10),
    ('Sobrancelha', 'Design de Sobrancelha', 'Modelagem com pinca e lamina', 20, 30.00, 5)
) AS s(categoria, nome, descricao, duracao, preco, buffer)
JOIN categorias_servicos c ON c.nome = s.categoria
ON CONFLICT (nome) DO UPDATE SET
  duracao_minutos = EXCLUDED.duracao_minutos,
  preco = EXCLUDED.preco,
  updated_at = NOW();

-- =====================================================
-- TABELA: agendamentos
-- =====================================================
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  barbeiro_id UUID REFERENCES barbeiros(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos(id) ON DELETE CASCADE,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'no_show')) DEFAULT 'pendente',
  observacoes TEXT,
  valor_total DECIMAL(10,2) NOT NULL,
  gorjeta DECIMAL(10,2) DEFAULT 0.00,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'fiado')),
  pago BOOLEAN DEFAULT false,
  comprovante_url TEXT,
  criado_por UUID REFERENCES perfis(id) ON DELETE SET NULL,
  cancelado_em TIMESTAMPTZ,
  cancelado_motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_datas_validas CHECK (data_fim > data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data ON agendamentos(barbeiro_id, data_inicio) WHERE status != 'cancelado';
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status) WHERE status IN ('pendente', 'confirmado', 'em_andamento');

-- =====================================================
-- TABELA: transacoes
-- =====================================================
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('receita', 'despesa', 'ajuste')) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT,
  descricao TEXT,
  status TEXT CHECK (status IN ('pendente', 'pago', 'estornado', 'cancelado')) DEFAULT 'pendente',
  pix_copia_cola TEXT,
  pix_qr_code_url TEXT,
  comprovante_url TEXT,
  processado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_agendamento ON transacoes(agendamento_id);

-- =====================================================
-- TABELA: notificacoes
-- =====================================================
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES perfis(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('lembrete_agendamento', 'confirmacao', 'promocao', 'sistema')) NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  canal_envio TEXT[] DEFAULT ARRAY['app'],
  agendado_para TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida) WHERE lida = false;

-- =====================================================
-- TABELA: audit_log
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_afetada TEXT NOT NULL,
  registro_id UUID NOT NULL,
  acao TEXT CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT_SENSITIVE')) NOT NULL,
  usuario_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  ip_origem INET,
  user_agent TEXT,
  dados_antigos JSONB,
  dados_novos JSONB,
  campos_alterados TEXT[],
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tabela_registro ON audit_log(tabela_afetada, registro_id);

-- =====================================================
-- TABELA: arquivos
-- =====================================================
CREATE TABLE IF NOT EXISTS arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL DEFAULT 'uploads',
  path TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  mime_type TEXT,
  tamanho_bytes INTEGER,
  uploaded_by UUID REFERENCES perfis(id) ON DELETE SET NULL,
  contexto TEXT CHECK (contexto IN ('foto_barbeiro', 'foto_cliente', 'comprovante', 'outro')),
  contexto_id UUID,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arquivos_contexto ON arquivos(contexto, contexto_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquivos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES (DROP + CREATE para idempotencia)
-- =====================================================
DROP POLICY IF EXISTS perfis_read ON perfis;
CREATE POLICY perfis_read ON perfis FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'));

DROP POLICY IF EXISTS perfis_admin_write ON perfis;
CREATE POLICY perfis_admin_write ON perfis FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'));

DROP POLICY IF EXISTS barbeiros_read ON barbeiros;
CREATE POLICY barbeiros_read ON barbeiros FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'barbeiro'))
    OR EXISTS (SELECT 1 FROM barbeiros b WHERE b.perfil_id = auth.uid() AND b.id = barbeiros.id)
  );

DROP POLICY IF EXISTS barbeiros_admin_write ON barbeiros;
CREATE POLICY barbeiros_admin_write ON barbeiros FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'));

DROP POLICY IF EXISTS clientes_read ON clientes;
CREATE POLICY clientes_read ON clientes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin')
    OR criado_por IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  );

DROP POLICY IF EXISTS clientes_write ON clientes;
CREATE POLICY clientes_write ON clientes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin')
    OR criado_por IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin')
    OR criado_por IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  );

DROP POLICY IF EXISTS servicos_public_read ON servicos;
CREATE POLICY servicos_public_read ON servicos FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS servicos_admin_write ON servicos;
CREATE POLICY servicos_admin_write ON servicos FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'));

DROP POLICY IF EXISTS agendamentos_read ON agendamentos;
CREATE POLICY agendamentos_read ON agendamentos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin')
    OR barbeiro_id IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  );

DROP POLICY IF EXISTS agendamentos_write ON agendamentos;
CREATE POLICY agendamentos_write ON agendamentos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'atendente'))
    OR barbeiro_id IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'atendente'))
    OR barbeiro_id IN (SELECT b.id FROM barbeiros b WHERE b.perfil_id = auth.uid())
  );

DROP POLICY IF EXISTS transacoes_read ON transacoes;
CREATE POLICY transacoes_read ON transacoes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin')
    OR EXISTS (
      SELECT 1 FROM agendamentos a
      JOIN barbeiros b ON b.id = a.barbeiro_id
      WHERE a.id = transacoes.agendamento_id AND b.perfil_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS transacoes_admin_write ON transacoes;
CREATE POLICY transacoes_admin_write ON transacoes FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'));

DROP POLICY IF EXISTS notificacoes_user_own ON notificacoes;
CREATE POLICY notificacoes_user_own ON notificacoes FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS audit_log_admin_only ON audit_log;
CREATE POLICY audit_log_admin_only ON audit_log FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin'));

DROP POLICY IF EXISTS arquivos_read ON arquivos;
CREATE POLICY arquivos_read ON arquivos FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.cargo = 'admin')
  );

DROP POLICY IF EXISTS arquivos_upload ON arquivos;
CREATE POLICY arquivos_upload ON arquivos FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- =====================================================
-- TRIGGERS: updated_at automatico
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_updated_at_perfis ON perfis;
CREATE TRIGGER trigger_update_updated_at_perfis BEFORE UPDATE ON perfis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_barbeiros ON barbeiros;
CREATE TRIGGER trigger_update_updated_at_barbeiros BEFORE UPDATE ON barbeiros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_clientes ON clientes;
CREATE TRIGGER trigger_update_updated_at_clientes BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_servicos ON servicos;
CREATE TRIGGER trigger_update_updated_at_servicos BEFORE UPDATE ON servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_agendamentos ON agendamentos;
CREATE TRIGGER trigger_update_updated_at_agendamentos BEFORE UPDATE ON agendamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_transacoes ON transacoes;
CREATE TRIGGER trigger_update_updated_at_transacoes BEFORE UPDATE ON transacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_arquivos ON arquivos;
CREATE TRIGGER trigger_update_updated_at_arquivos BEFORE UPDATE ON arquivos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FIM DO SCRIPT