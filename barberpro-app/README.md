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
- `app/(dashboard)/dashboard` - dashboard com KPIs reais
- `app/(dashboard)/dashboard/barbeiros` - CRUD de barbeiros
- `app/(dashboard)/dashboard/servicos` - CRUD de servicos
- `app/(dashboard)/clientes` - CRUD de clientes
- `app/(dashboard)/agendamentos` - CRUD de agendamentos + sincronizacao em transacoes
- `app/api/webhooks/pix/route.ts` - webhook PIX (esqueleto seguro)
- `lib/supabase/server.ts` - client server SSR + Server Actions
- `lib/supabase/client.ts` - client browser SSR
- `middleware.ts` - protecao de rotas + refresh de sessao

## Como rodar
1. Instale dependencias:
```bash
npm install
```

2. Copie variaveis de ambiente:
```bash
copy .env.example .env.local
```

3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Rode o projeto:
```bash
npm run dev
```

5. Build de producao:
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
- Inclui tabelas de dominio (`perfis`, `barbeiros`, `clientes`, `servicos`, `agendamentos`, `transacoes`, `notificacoes`, `audit_log`, `arquivos`)
- RLS habilitado com policies por cargo (`admin`, `barbeiro`, `atendente`)
- Triggers de `updated_at` e seeds iniciais de categorias/servicos

## Checklist UNIVESP (status)
- Next.js local: pronto
- Login/logout Supabase + cookies seguros: pronto
- CRUDs com Zod: barbeiros, servicos, clientes, agendamentos: pronto
- LGPD visivel (checkbox + politica): pronto
- Supabase conectado + RLS: pronto
- UI responsiva mobile-first dark: pronto
- Relatorio de status (MD + PDF): pronto

## Observacao para login
- O acesso usa usuario do **Supabase Auth** (Authentication > Users), nao senha do PostgreSQL.
- Para permissao administrativa no app, o usuario precisa existir na tabela `perfis` com `cargo='admin'`.