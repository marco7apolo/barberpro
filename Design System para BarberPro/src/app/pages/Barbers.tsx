import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';

interface Barber {
  id: number;
  name: string;
  photo: string;
  specialties: string[];
  commission: number;
  phone: string;
  email: string;
  status: 'active' | 'break' | 'inactive';
}

export function Barbers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  const barbers: Barber[] = [
    {
      id: 1,
      name: 'João Santos',
      photo: '👨‍🦱',
      specialties: ['Cortes Clássicos', 'Barba', 'Degradê'],
      commission: 60,
      phone: '(11) 98765-4321',
      email: 'joao@barberpro.com',
      status: 'active'
    },
    {
      id: 2,
      name: 'Pedro Costa',
      photo: '👨‍🦰',
      specialties: ['Cortes Modernos', 'Coloração'],
      commission: 55,
      phone: '(11) 98765-4322',
      email: 'pedro@barberpro.com',
      status: 'active'
    },
    {
      id: 3,
      name: 'Lucas Silva',
      photo: '👨',
      specialties: ['Barba', 'Sobrancelha'],
      commission: 50,
      phone: '(11) 98765-4323',
      email: 'lucas@barberpro.com',
      status: 'break'
    }
  ];

  const statusColors = {
    active: 'bg-success/20 text-success border-success/30',
    break: 'bg-warning/20 text-warning border-warning/30',
    inactive: 'bg-muted text-muted-foreground border-border'
  };

  const statusLabels = {
    active: 'Ativo',
    break: 'Em Pausa',
    inactive: 'Inativo'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Barbeiros</h1>
          <p className="text-muted-foreground">Gerencie sua equipe</p>
        </div>
        <Button variant="primary" className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Adicionar Barbeiro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map(barber => (
          <Card key={barber.id}>
            <CardContent>
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{barber.photo}</div>
                <div className="flex-1">
                  <h3 className="text-lg mb-1">{barber.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs border ${statusColors[barber.status]}`}>
                    {statusLabels[barber.status]}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Especialidades</p>
                  <div className="flex flex-wrap gap-1">
                    {barber.specialties.map(spec => (
                      <span key={spec} className="px-2 py-1 bg-muted rounded text-xs">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comissão</p>
                  <p className="text-primary">{barber.commission}%</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} />
                    <span>{barber.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} />
                    <span className="truncate">{barber.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedBarber(barber)}>
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Barbeiro"
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Nome Completo</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite o nome"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Comissão (%)</label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="50"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
