import { Clock, User, Scissors } from 'lucide-react';
import { Badge } from './Badge';
import { Card } from './Card';

interface AppointmentCardProps {
  client: string;
  service: string;
  barber: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  onClick?: () => void;
}

export function AppointmentCard({
  client,
  service,
  barber,
  time,
  status,
  onClick
}: AppointmentCardProps) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:border-primary/30">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-foreground mb-1">{client}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>{time}</span>
          </div>
        </div>
        <Badge status={status}>
          {status === 'confirmed' && 'Confirmado'}
          {status === 'pending' && 'Pendente'}
          {status === 'cancelled' && 'Cancelado'}
          {status === 'completed' && 'Concluído'}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Scissors size={14} />
          <span>{service}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User size={14} />
          <span>{barber}</span>
        </div>
      </div>
    </Card>
  );
}
