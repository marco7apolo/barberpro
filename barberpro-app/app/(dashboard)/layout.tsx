import Link from "next/link";
import type { ReactNode } from "react";

import { redirect } from "next/navigation";
import {
  CalendarDays,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Scissors,
  Users,
  Wrench,
} from "lucide-react";

import { Button } from "@/app/ui/button";
import {
  ensureBootstrapProfile,
  getAuthenticatedUser,
  signOutAction,
} from "@/lib/supabase/server";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const dynamic = "force-dynamic";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/barbeiros", label: "Barbeiros", icon: Users },
  { href: "/dashboard/servicos", label: "Servicos", icon: Scissors },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { href: "/dashboard/relatorios", label: "Relatorios", icon: FileBarChart },
] as const;

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  await ensureBootstrapProfile(user);

  async function handleSignOut() {
    "use server";

    await signOutAction();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-r border-border bg-card/60 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-primary">BarberPro</h1>
            <p className="text-sm text-muted-foreground">Painel administrativo</p>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 text-foreground">
              <Wrench className="h-3.5 w-3.5" />
              Tenant preparado
            </div>
            <p>
              O middleware pode injetar `barbearia_id` por dominio/subdominio em uma proxima
              etapa sem quebrar o schema.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
            <div>
              <p className="text-sm text-muted-foreground">Sessao autenticada</p>
              <p className="text-sm font-medium">{user.email ?? "Usuario"}</p>
            </div>

            <form action={handleSignOut}>
              <Button type="submit" variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          </header>

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
