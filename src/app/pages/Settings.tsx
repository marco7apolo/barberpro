import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Clock, Bell, Zap, Save } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="text-primary" />
            <CardTitle>Horário de Funcionamento</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { day: 'Segunda-feira', from: '09:00', to: '19:00' },
            { day: 'Terça-feira', from: '09:00', to: '19:00' },
            { day: 'Quarta-feira', from: '09:00', to: '19:00' },
            { day: 'Quinta-feira', from: '09:00', to: '19:00' },
            { day: 'Sexta-feira', from: '09:00', to: '20:00' },
            { day: 'Sábado', from: '09:00', to: '18:00' },
          ].map(schedule => (
            <div key={schedule.day} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="w-32 text-muted-foreground">{schedule.day}</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  defaultValue={schedule.from}
                  className="px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-muted-foreground">até</span>
                <input
                  type="time"
                  defaultValue={schedule.to}
                  className="px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="sunday"
              className="w-4 h-4 rounded border-border bg-input-background"
            />
            <label htmlFor="sunday" className="text-muted-foreground">Abrir aos domingos</label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="text-primary" />
            <CardTitle>Notificações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'new-booking', label: 'Novos agendamentos', enabled: true },
            { id: 'cancellations', label: 'Cancelamentos', enabled: true },
            { id: 'reminders', label: 'Lembretes de atendimento', enabled: true },
            { id: 'daily-summary', label: 'Resumo diário', enabled: false },
            { id: 'weekly-report', label: 'Relatório semanal', enabled: true },
          ].map(notification => (
            <div key={notification.id} className="flex items-center justify-between">
              <label htmlFor={notification.id}>{notification.label}</label>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  id={notification.id}
                  defaultChecked={notification.enabled}
                  className="peer sr-only"
                />
                <div className="w-12 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors cursor-pointer" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="text-primary" />
            <CardTitle>Integrações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'WhatsApp Business', status: 'connected', color: 'text-success' },
            { name: 'Google Calendar', status: 'disconnected', color: 'text-muted-foreground' },
            { name: 'Instagram', status: 'connected', color: 'text-success' },
            { name: 'Mercado Pago', status: 'pending', color: 'text-warning' },
          ].map(integration => (
            <div key={integration.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${integration.status === 'connected' ? 'bg-success' : integration.status === 'pending' ? 'bg-warning' : 'bg-muted-foreground'}`} />
                <span>{integration.name}</span>
              </div>
              <Button variant="outline" size="sm">
                {integration.status === 'connected' ? 'Configurar' : 'Conectar'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" size="lg">
          <Save size={20} className="mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
