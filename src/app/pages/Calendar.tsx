import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Badge } from '../components/Badge';

export function Calendar() {
  const [currentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const appointments = [
    { time: '09:00', client: 'Carlos Silva', service: 'Corte', barber: 'João', status: 'confirmed' as const },
    { time: '10:00', client: 'Ricardo Oliveira', service: 'Barba', barber: 'Pedro', status: 'pending' as const },
    { time: '14:00', client: 'Fernando Lima', service: 'Corte + Barba', barber: 'João', status: 'confirmed' as const },
    { time: '15:00', client: 'André Costa', service: 'Corte', barber: 'Lucas', status: 'confirmed' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie a agenda da barbearia</p>
        </div>
        <Button variant="primary" className="w-full sm:w-auto">
          <Plus size={20} className="mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <ChevronLeft size={18} />
              </Button>
              <h3 className="text-lg">
                {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <Button variant="outline" size="sm">
                <ChevronRight size={18} />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={view === 'day' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Dia
              </Button>
              <Button
                variant={view === 'week' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semana
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {timeSlots.map(time => {
              const apt = appointments.find(a => a.time === time);

              return (
                <div
                  key={time}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors min-h-[60px]"
                >
                  <div className="text-sm text-muted-foreground w-16">{time}</div>

                  {apt ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-foreground mb-1">{apt.client}</p>
                        <p className="text-sm text-muted-foreground">{apt.service} • {apt.barber}</p>
                      </div>
                      <Badge status={apt.status}>
                        {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex-1 text-muted-foreground text-sm">Horário disponível</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
