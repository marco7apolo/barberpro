import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";

import { AppointmentCard } from "@/app/components/AppointmentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";

const kpis = [
  {
    title: "Agendamentos Hoje",
    value: "12",
    change: "+3 vs ontem",
    icon: Calendar,
    color: "text-primary",
  },
  {
    title: "Faturamento Hoje",
    value: "R$ 1.240",
    change: "+15% vs ontem",
    icon: DollarSign,
    color: "text-green-500",
  },
  {
    title: "Barbeiros Ativos",
    value: "4/5",
    change: "1 em pausa",
    icon: Users,
    color: "text-sky-400",
  },
  {
    title: "Taxa de Ocupacao",
    value: "78%",
    change: "+5% vs semana passada",
    icon: TrendingUp,
    color: "text-amber-400",
  },
] as const;

const todayAppointments = [
  {
    id: 1,
    client: "Carlos Silva",
    service: "Corte + Barba",
    barber: "Joao Santos",
    time: "14:00",
    status: "confirmed" as const,
  },
  {
    id: 2,
    client: "Ricardo Oliveira",
    service: "Corte Degrade",
    barber: "Pedro Costa",
    time: "14:30",
    status: "pending" as const,
  },
  {
    id: 3,
    client: "Fernando Lima",
    service: "Barba",
    barber: "Joao Santos",
    time: "15:00",
    status: "confirmed" as const,
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral operacional do negocio.</p>
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
            {todayAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} {...appointment} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatisticas Rapidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Servico mais popular</span>
              <span>Corte + Barba</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Barbeiro destaque</span>
              <span>Joao Santos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ticket medio</span>
              <span className="text-green-500">R$ 68,00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Novos clientes (mes)</span>
              <span className="text-primary">23</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}