import { useState } from 'react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
}

export function Services() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const services: Service[] = [
    { id: 1, name: 'Corte Simples', category: 'Cabelo', duration: 30, price: 35 },
    { id: 2, name: 'Corte + Barba', category: 'Combo', duration: 60, price: 65 },
    { id: 3, name: 'Barba', category: 'Barba', duration: 30, price: 30 },
    { id: 4, name: 'Corte Degradê', category: 'Cabelo', duration: 45, price: 45 },
    { id: 5, name: 'Platinado', category: 'Coloração', duration: 90, price: 120 },
    { id: 6, name: 'Sobrancelha', category: 'Outros', duration: 15, price: 15 },
  ];

  const categories = ['Todos', 'Cabelo', 'Barba', 'Combo', 'Coloração', 'Outros'];
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filteredServices = activeCategory === 'Todos'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Serviços</h1>
          <p className="text-muted-foreground">Catálogo de serviços</p>
        </div>
        <Button variant="primary" className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Novo Serviço
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="whitespace-nowrap"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => (
          <Card key={service.id}>
            <CardContent>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg mb-1">{service.name}</h3>
                  <span className="inline-block px-2 py-1 bg-muted rounded text-xs">
                    {service.category}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} />
                  <span>{service.duration} minutos</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <DollarSign size={16} />
                  <span className="text-xl">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
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
        title="Novo Serviço"
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Nome do Serviço</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Corte Degradê"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Categoria</label>
            <select className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Cabelo</option>
              <option>Barba</option>
              <option>Combo</option>
              <option>Coloração</option>
              <option>Outros</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Duração (min)</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Preço (R$)</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="35.00"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
