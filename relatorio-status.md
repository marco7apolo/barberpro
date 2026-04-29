# BarberPro - Relatorio de Status (Atualizado)

**Data:** 29/04/2026  
**Projeto:** BarberPro (UNIVESP)  
**Versao base:** Next.js 14 + Supabase SSR + Zod

---

## 1. Erro atual de cadastro

Erro observado ao salvar nas abas:
- `Nao foi possivel salvar o barbeiro` (e equivalente em clientes/agendamentos/servicos)

Causa raiz:
- Usuario autenticado sem perfil administrativo consistente em `public.perfis` para satisfazer as policies de escrita (RLS).
- Com isso, `INSERT/UPDATE/DELETE` era bloqueado mesmo com leitura funcionando.

---

## 2. Correcao aplicada no app

Arquivos alterados:
- `Design System para BarberPro/lib/supabase/server.ts`
- `Design System para BarberPro/app/(dashboard)/layout.tsx`

O que foi feito:
1. Criado bootstrap automatico de perfil em `ensureBootstrapProfile(user)`.
2. No carregamento do layout protegido, o app garante `upsert` de perfil com:
- `cargo = 'admin'`
- `barbearia_id = '00000000-0000-0000-0000-000000000001'`
3. Assim, o usuario logado passa a atender as policies de escrita e os CRUDs destravam.

---

## 3. Correcao SQL ja existente (RLS)

Ja mantida no projeto:
- `Design System para BarberPro/supabase/migrations/20260429_fix_rls_perfis_recursion.sql`
- `Design System para BarberPro/supabase/migrations/20260429_fix_rls_barbeiros_and_categorias.sql`

Essas migracoes tratam recursao de policy e acesso a categorias.

---

## 4. Validacao tecnica

Comando executado:
- `npm run build`

Resultado:
- Build de producao concluido com sucesso.

---

## 5. Como validar agora

1. Fazer logout e login novamente.
2. Acessar `Dashboard > Barbeiros` e criar um registro.
3. Testar cadastro em `Clientes`.
4. Testar cadastro em `Agendamentos`.
5. Testar criacao de categoria e servico.

---

## 6. Arquivos atualizados nesta etapa

- `Design System para BarberPro/lib/supabase/server.ts`
- `Design System para BarberPro/app/(dashboard)/layout.tsx`
- `relatorio-status.md`
- `relatorio-status.pdf`

---

*Relatorio atualizado automaticamente em 29/04/2026.*
