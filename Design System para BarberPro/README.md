# BarberPro - Next.js 14 + Supabase SSR

Projeto migrado de React + Vite para Next.js 14 (App Router), preservando os componentes UI existentes (shadcn/ui + Tailwind + Radix + tokens do Figma).

## Stack
- Next.js 14 (App Router)
- React 18
- TypeScript strict
- Tailwind CSS v4
- shadcn/ui + Radix UI
- Supabase Auth + DB (`@supabase/ssr`)
- Zod (validacao front e back)

## Estrutura principal
- `app/(auth)/login` - login centralizado, sem sidebar
- `app/(dashboard)/layout.tsx` - layout protegido (sidebar + header)
- `app/(dashboard)/dashboard` - KPIs + CRUDs
- `app/api/webhooks/pix/route.ts` - webhook PIX (esqueleto seguro)
- `lib/supabase/server.ts` - client server SSR + Server Actions
- `lib/supabase/client.ts` - client browser SSR
- `middleware.ts` - protecao de rotas + refresh de sessao

## Como rodar
1. Instale dependencias (`npm`):
```bash
npm install
```

2. Ou instale com `pnpm`:
```bash
pnpm install
```

3. Copie variaveis de ambiente:
```bash
copy .env.example .env.local
```

4. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

5. Rode o projeto (`npm`):
```bash
npm run dev
```

6. Ou rode com `pnpm`:
```bash
pnpm dev
```

7. Build de producao:
```bash
npm run build
npm run start
```

## Auth e seguranca
- Sessao via cookies HttpOnly (sem localStorage).
- Login/logout por Server Actions.
- Middleware renova token automaticamente para reduzir logout inesperado.
- Erros de autenticacao com mensagem generica.

## LGPD
- Checkbox de consentimento no login.
- Link visivel para `/politica-de-privacidade`.

## Banco e RLS (schema final aplicado)
- Migration espelho do ambiente Supabase:
`supabase/migrations/20260429_schema_final_rls_lgpd.sql`
- Inclui tabelas de dominio (`perfis`, `barbeiros`, `clientes`, `servicos`, `agendamentos`, etc.)
- RLS habilitado com policies por cargo (`admin`, `barbeiro`, `atendente`)
- Triggers de `updated_at` e seeds iniciais de categorias/servicos

## SQL rapido (referencia)
O SQL completo usado no projeto esta em:
`supabase/migrations/20260429_schema_final_rls_lgpd.sql`

## Credenciais de teste (exemplo)
Crie um usuario no Supabase Auth:
- Email: `teste@barberpro.local`
- Senha: `Barber@12345`

## Checklist UNIVESP (status)
- Next.js local: pronto (`npm run dev`)
- Login/logout Supabase + cookies seguros: pronto
- 2 CRUDs com Zod (Barbeiros + Servicos): pronto
- LGPD visivel (checkbox + politica): pronto
- Supabase conectado + RLS: pronto via migration
- UI responsiva mobile-first dark: pronto
- GitHub com commits semanticos: pendente de commit local

## Sugestao de commits semanticos
1. `feat(next): migrar estrutura vite para next14 app router`
2. `feat(auth): implementar supabase ssr com middleware e server actions`
3. `feat(crud): adicionar crud de barbeiros e servicos com zod`
4. `chore(db): criar migration com barbearia_id e rls`
5. `docs(readme): documentar setup, env e checklist univesp`
