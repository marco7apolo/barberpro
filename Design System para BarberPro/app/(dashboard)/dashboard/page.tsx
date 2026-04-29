import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";

import { AppointmentCard } from "@/app/components/AppointmentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toCurrencyBRL(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function mapStatusToCardStatus(status: string) {
  if (status === "confirmado") return "confirmed" as const;
  if (status === "concluido") return "completed" as const;
  if (status === "cancelado" || status === "no_show") return "cancelled" as const;
  return "pending" as const;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const dayStartIso = dayStart.toISOString();
  const dayEndIso = dayEnd.toISOString();

  const [
    { data: agendamentosHoje },
    { data: receitasHoje },
    { data: barbeirosAtivos },
    { data: barbeirosTotal },
    { data: proximosAgendamentos },
    { data: servicos },
  ] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("id, status, cliente_id, barbeiro_id, servico_id, data_inicio")
      .gte("data_inicio", dayStartIso)
      .lte("data_inicio", dayEndIso),
    supabase
      .from("transacoes")
      .select("valor")
      .eq("tipo", "receita")
      .eq("status", "pago")
      .gte("created_at", dayStartIso)
      .lte("created_at", dayEndIso),
    supabase.from("barbeiros").select("id").eq("ativo", true),
    supabase.from("barbeiros").select("id"),
    supabase
      .from("agendamentos")
      .select("id, status, cliente_id, barbeiro_id, servico_id, data_inicio")
      .gte("data_inicio", now.toISOString())
      .neq("status", "cancelado")
      .order("data_inicio", { ascending: true })
      .limit(5),
    supabase.from("servicos").select("id, nome"),
  ]);

  const clientesIds = Array.from(
    new Set((proximosAgendamentos ?? []).map((item) => item.cliente_id).filter(Boolean)),
  );
  const barbeirosIds = Array.from(
    new Set((proximosAgendamentos ?? []).map((item) => item.barbeiro_id).filter(Boolean)),
  );

  const [{ data: clientesNomes }, { data: barbeirosNomes }] = await Promise.all([
    clientesIds.length > 0
      ? supabase.from("clientes").select("id, nome").in("id", clientesIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    barbeirosIds.length > 0
      ? supabase.from("barbeiros").select("id, nome_exibicao").in("id", barbeirosIds)
      : Promise.resolve({ data: [] as { id: string; nome_exibicao: string }[] }),
  ]);

  const clientesMap = new Map((clientesNomes ?? []).map((item) => [item.id, item.nome]));
  const barbeirosMap = new Map((barbeirosNomes ?? []).map((item) => [item.id, item.nome_exibicao]));
  const servicosMap = new Map((servicos ?? []).map((item) => [item.id, item.nome]));

  const faturamentoHoje = (receitasHoje ?? []).reduce((acc, row) => acc + Number(row.valor ?? 0), 0);
  const agendamentosHojeCount = (agendamentosHoje ?? []).length;
  const ativosCount = (barbeirosAtivos ?? []).length;
  const totalBarbeirosCount = (barbeirosTotal ?? []).length;
  const taxaOcupacao = ativosCount > 0 ? Math.min(100, Math.round((agendamentosHojeCount / ativosCount) * 100)) : 0;

  const kpis = [
    {
      title: "Agendamentos Hoje",
      value: String(agendamentosHojeCount),
      change: "Baseado nos registros de hoje",
      icon: Calendar,
      color: "text-primary",
    },
    {
      title: "Faturamento Hoje",
      value: toCurrencyBRL(faturamentoHoje),
      change: "Transacoes pagas do dia",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Barbeiros Ativos",
      value: `${ativosCount}/${totalBarbeirosCount}`,
      change: "Status atual da equipe",
      icon: Users,
      color: "text-sky-400",
    },
    {
      title: "Taxa de Ocupacao",
      value: `${taxaOcupacao}%`,
      change: "Agendamentos por barbeiro ativo",
      icon: TrendingUp,
      color: "text-amber-400",
    },
  ] as const;

  const appointments = (proximosAgendamentos ?? []).map((appointment) => {
    const startDate = new Date(appointment.data_inicio);
    const time = Number.isNaN(startDate.getTime())
      ? "--:--"
      : startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return {
      id: appointment.id,
      client: clientesMap.get(appointment.cliente_id) ?? "Cliente",
      service: servicosMap.get(appointment.servico_id) ?? "Servico",
      barber: barbeirosMap.get(appointment.barbeiro_id) ?? "Barbeiro",
      time,
      status: mapStatusToCardStatus(appointment.status),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral operacional com dados reais do Supabase.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.title}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="mb-1 text-2xl">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.change}</p>
                  </div>
                  <div className={`rounded-lg bg-muted p-3 ${kpi.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} {...appointment} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum agendamento futuro encontrado.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatisticas Rapidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total de agendamentos hoje</span>
              <span>{agendamentosHojeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Receita recebida hoje</span>
              <span className="text-green-500">{toCurrencyBRL(faturamentoHoje)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Barbeiros ativos</span>
              <span>{ativosCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Servicos cadastrados</span>
              <span>{(servicos ?? []).length}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
