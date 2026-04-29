# BarberPro - Relatorio de Status (Atualizado)

**Data:** 29/04/2026  
**Projeto:** BarberPro (UNIVESP)  
**Versao base:** Next.js 14 + Supabase SSR + Zod

---

## 1. Erro encontrado e motivo

Erro apresentado nas telas:
- `Erro ao carregar agendamentos: infinite recursion detected in policy for relation "perfis"`

Causa raiz:
- A policy da tabela `perfis` consultava a propria tabela `perfis` dentro do `USING/WITH CHECK`.
- Quando outra tabela (ex.: `agendamentos`) avaliava policy com subquery em `perfis`, o Postgres precisava validar a policy de `perfis`, que por sua vez consultava `perfis` novamente, gerando recursao infinita (`42P17`).

---

## 2. Correcao aplicada

Arquivo SQL criado no projeto:
- `Design System para BarberPro/supabase/migrations/20260429_fix_rls_perfis_recursion.sql`

O que esse fix faz:
1. Cria funcao `public.is_admin_user()` com `SECURITY DEFINER` para verificar se o usuario autenticado e admin sem cair em recursao de RLS.
2. Remove policies antigas de `perfis` (`perfis_read`, `perfis_admin_write`).
3. Recria policies de `perfis` de forma segura:
- `perfis_select_self_or_admin`
- `perfis_insert_self_or_admin`
- `perfis_update_self_or_admin`
- `perfis_delete_admin_only`

---

## 3. Como aplicar no Supabase (passo a passo)

1. Abra `Supabase Dashboard -> SQL Editor`.
2. Clique em `New Query`.
3. Cole o conteudo de:
`Design System para BarberPro/supabase/migrations/20260429_fix_rls_perfis_recursion.sql`
4. Execute `Run`.
5. Recarregue a aplicacao em `http://localhost:3002` (ou porta atual).
6. Teste novamente as abas `Agendamentos`, `Clientes`, `Barbeiros` e `Servicos`.

---

## 4. Status atual dos modulos

| Modulo | Status | Observacao |
|---|---|---|
| Auth + cookies HttpOnly | Pronto | Supabase SSR + middleware |
| Dashboard | Pronto | Dados reais do banco |
| CRUD Barbeiros | Pronto | Schema real |
| CRUD Servicos | Pronto | Schema real + categorias |
| CRUD Clientes | Pronto | Inclui LGPD em JSON |
| CRUD Agendamentos | Pronto | Integrado com transacoes |
| RLS + Policies | Corrigido | Fix para recursao em `perfis` adicionado |
| Webhook PIX | Em progresso | Esqueleto pronto |

---

## 5. Validacao recomendada apos o fix

1. Entrar no sistema com usuario Auth.
2. Abrir Dashboard e Agendamentos.
3. Criar e editar um cliente.
4. Criar e editar um agendamento.
5. Confirmar no Supabase que `transacoes` foi sincronizada.

---

## 6. Arquivos atualizados nesta correcao

- `Design System para BarberPro/supabase/migrations/20260429_fix_rls_perfis_recursion.sql`
- `relatorio-status.md`
- `relatorio-status.pdf`

---

*Relatorio atualizado automaticamente em 29/04/2026.*
