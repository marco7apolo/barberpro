-- =====================================================
-- BarberPro - Fix RLS recursion for "barbeiros" + categorias access
-- Data: 2026-04-29
-- Motivo:
--   1) Policy de barbeiros fazia subquery na propria tabela barbeiros
--      dentro de USING, gerando recursao infinita (42P17).
--   2) Tela de servicos sem categorias para selecao/cadastro.
-- =====================================================

-- Helper: verifica cargos sem depender de policy recursiva em perfis.
create or replace function public.user_has_cargo(allowed_cargos text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = auth.uid()
      and p.ativo = true
      and p.cargo = any (allowed_cargos)
  );
$$;

revoke all on function public.user_has_cargo(text[]) from public;
grant execute on function public.user_has_cargo(text[]) to authenticated;

-- Helper: retorna o barbeiro vinculado ao usuario logado (perfil_id = auth.uid()).
create or replace function public.current_barbeiro_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.barbeiros b
  where b.perfil_id = auth.uid()
    and b.ativo = true
  order by b.created_at asc
  limit 1
$$;

revoke all on function public.current_barbeiro_id() from public;
grant execute on function public.current_barbeiro_id() to authenticated;

-- =====================================================
-- barbeiros: remove recursao
-- =====================================================
drop policy if exists barbeiros_read on public.barbeiros;
drop policy if exists barbeiros_admin_write on public.barbeiros;
drop policy if exists barbeiros_select_safe on public.barbeiros;
drop policy if exists barbeiros_write_admin_only on public.barbeiros;

create policy barbeiros_select_safe
on public.barbeiros
for select
to authenticated
using (
  (select public.is_admin_user())
  or (select public.user_has_cargo(array['barbeiro']::text[]))
  or perfil_id = auth.uid()
);

create policy barbeiros_write_admin_only
on public.barbeiros
for all
to authenticated
using (
  (select public.is_admin_user())
)
with check (
  (select public.is_admin_user())
);

-- =====================================================
-- clientes/agendamentos/transacoes: usam helper sem subquery direta recursiva
-- =====================================================
drop policy if exists clientes_read on public.clientes;
drop policy if exists clientes_write on public.clientes;

create policy clientes_read
on public.clientes
for select
to authenticated
using (
  (select public.is_admin_user())
  or criado_por = (select public.current_barbeiro_id())
);

create policy clientes_write
on public.clientes
for all
to authenticated
using (
  (select public.is_admin_user())
  or criado_por = (select public.current_barbeiro_id())
)
with check (
  (select public.is_admin_user())
  or criado_por = (select public.current_barbeiro_id())
);

drop policy if exists agendamentos_read on public.agendamentos;
drop policy if exists agendamentos_write on public.agendamentos;

create policy agendamentos_read
on public.agendamentos
for select
to authenticated
using (
  (select public.is_admin_user())
  or barbeiro_id = (select public.current_barbeiro_id())
);

create policy agendamentos_write
on public.agendamentos
for all
to authenticated
using (
  (select public.is_admin_user())
  or (select public.user_has_cargo(array['atendente']::text[]))
  or barbeiro_id = (select public.current_barbeiro_id())
)
with check (
  (select public.is_admin_user())
  or (select public.user_has_cargo(array['atendente']::text[]))
  or barbeiro_id = (select public.current_barbeiro_id())
);

drop policy if exists transacoes_read on public.transacoes;

create policy transacoes_read
on public.transacoes
for select
to authenticated
using (
  (select public.is_admin_user())
  or exists (
    select 1
    from public.agendamentos a
    where a.id = transacoes.agendamento_id
      and a.barbeiro_id = (select public.current_barbeiro_id())
  )
);

-- =====================================================
-- categorias_servicos: acesso explicito para alimentar select de servicos
-- =====================================================
alter table if exists public.categorias_servicos enable row level security;

drop policy if exists categorias_servicos_read on public.categorias_servicos;
drop policy if exists categorias_servicos_admin_write on public.categorias_servicos;

create policy categorias_servicos_read
on public.categorias_servicos
for select
to authenticated
using (true);

create policy categorias_servicos_admin_write
on public.categorias_servicos
for all
to authenticated
using (
  (select public.is_admin_user())
)
with check (
  (select public.is_admin_user())
);

-- Seed idempotente caso a tabela esteja vazia
insert into public.categorias_servicos (nome, descricao, cor_badge, ordem_exibicao, ativo)
values
  ('Cortes', 'Servicos de corte de cabelo', '#3b82f6', 1, true),
  ('Barba', 'Barba completa e modelagem', '#ef4444', 2, true),
  ('Sobrancelha', 'Design e limpeza', '#22c55e', 3, true),
  ('Estetica', 'Hidratacao e tratamentos', '#a855f7', 4, true),
  ('Combo', 'Pacotes promocionais', '#f59e0b', 5, true)
on conflict (nome) do update
set
  descricao = excluded.descricao,
  cor_badge = excluded.cor_badge,
  ordem_exibicao = excluded.ordem_exibicao,
  ativo = excluded.ativo;

