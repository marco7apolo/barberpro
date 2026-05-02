import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { AppointmentCard } from '../components/AppointmentCard';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

export function Dashboard() {
  const kpis = [
    {
      title: 'Agendamentos Hoje',
      value: '12',
      change: '+3 vs ontem',
      icon: Calendar,
      color: 'text-primary'
    },
    {
      title: 'Faturamento Hoje',
      value: 'R$ 1.240',
      change: '+15% vs ontem',
      icon: DollarSign,
      color: 'text-success'
    },
    {
      title: 'Barbeiros Ativos',
      value: '4/5',
      change: '1 em pausa',
      icon: Users,
      color: 'text-info'
    },
    {
      title: 'Taxa de Ocupação',
      value: '78%',
      change: '+5% vs semana passada',
      icon: TrendingUp,
      color: 'text-warning'
    },
  ];

  const todayAppointments = [
    { id: 1, client: 'Carlos Silva', service: 'Corte + Barba', barber: 'João Santos', time: '14:00', status: 'confirmed' as const },
    { id: 2, client: 'Ricardo Oliveira', service: 'Corte Degradê', barber: 'Pedro Costa', time: '14:30', status: 'pending' as const },
    { id: 3, client: 'Fernando Lima', service: 'Barba', barber: 'João Santos', time: '15:00', status: 'confirmed' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                    <p className="text-2xl mb-1">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${kpi.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.map(apt => (
              <AppointmentCard key={apt.id} {...apt} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Serviço mais popular</span>
              <span>Corte + Barba</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Barbeiro destaque</span>
              <span>João Santos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ticket médio</span>
              <span className="text-success">R$ 68,00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Novos clientes (mês)</span>
              <span className="text-primary">23</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
