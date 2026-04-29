-- =====================================================
-- BarberPro - Fix RLS recursion in "perfis"
-- Data: 2026-04-29
-- Motivo:
--   As policies de "perfis" consultavam a propria tabela "perfis"
--   dentro do USING/WITH CHECK, causando:
--   "infinite recursion detected in policy for relation perfis"
-- =====================================================

-- Funcao SECURITY DEFINER para checar se o usuario autenticado e admin
-- sem depender da avaliacao recursiva de policy na propria tabela.
create or replace function public.is_admin_user()
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
      and p.cargo = 'admin'
      and p.ativo = true
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

-- Recria policies de perfis sem auto-consulta recursiva
drop policy if exists perfis_read on public.perfis;
drop policy if exists perfis_admin_write on public.perfis;

drop policy if exists perfis_select_self_or_admin on public.perfis;
create policy perfis_select_self_or_admin
on public.perfis
for select
to authenticated
using (
  auth.uid() = id
  or (select public.is_admin_user())
);

drop policy if exists perfis_insert_self_or_admin on public.perfis;
create policy perfis_insert_self_or_admin
on public.perfis
for insert
to authenticated
with check (
  auth.uid() = id
  or (select public.is_admin_user())
);

drop policy if exists perfis_update_self_or_admin on public.perfis;
create policy perfis_update_self_or_admin
on public.perfis
for update
to authenticated
using (
  auth.uid() = id
  or (select public.is_admin_user())
)
with check (
  auth.uid() = id
  or (select public.is_admin_user())
);

drop policy if exists perfis_delete_admin_only on public.perfis;
create policy perfis_delete_admin_only
on public.perfis
for delete
to authenticated
using (
  (select public.is_admin_user())
);
