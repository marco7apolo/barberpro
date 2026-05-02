import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Search, Phone, Mail, Clock, DollarSign } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  preferences: string[];
  lgpdConsent: boolean;
}

export function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const clients: Client[] = [
    {
      id: 1,
      name: 'Carlos Silva',
      phone: '(11) 98765-1111',
      email: 'carlos@email.com',
      totalVisits: 24,
      totalSpent: 1680,
      lastVisit: '2026-04-20',
      preferences: ['Corte degradê', 'Barba média', 'Sobrancelha'],
      lgpdConsent: true
    },
    {
      id: 2,
      name: 'Ricardo Oliveira',
      phone: '(11) 98765-2222',
      email: 'ricardo@email.com',
      totalVisits: 18,
      totalSpent: 1260,
      lastVisit: '2026-04-18',
      preferences: ['Corte simples', 'Barba completa'],
      lgpdConsent: true
    },
    {
      id: 3,
      name: 'Fernando Lima',
      phone: '(11) 98765-3333',
      email: 'fernando@email.com',
      totalVisits: 12,
      totalSpent: 840,
      lastVisit: '2026-04-15',
      preferences: ['Corte + barba', 'Platinado'],
      lgpdConsent: false
    }
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Clientes</h1>
        <p className="text-muted-foreground">Perfis e histórico de clientes</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {filteredClients.map(client => (
            <Card
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`cursor-pointer ${selectedClient?.id === client.id ? 'border-primary' : ''}`}
            >
              <CardContent>
                <h4 className="mb-2">{client.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{client.totalVisits} visitas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedClient ? (
            <Card>
              <CardHeader>
                <CardTitle>Perfil do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl mb-4">{selectedClient.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={16} />
                        <span>{selectedClient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={16} />
                        <span>{selectedClient.email}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        <span>{selectedClient.totalVisits} visitas realizadas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-success" />
                        <span>R$ {selectedClient.totalSpent.toFixed(2)} gastos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2">Última Visita</h4>
                  <p className="text-muted-foreground">
                    {new Date(selectedClient.lastVisit).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <h4 className="mb-2">Preferências</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.preferences.map(pref => (
                      <span key={pref} className="px-3 py-1 bg-muted rounded-lg text-sm">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2">LGPD</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedClient.lgpdConsent ? 'bg-success' : 'bg-destructive'}`} />
                    <span className="text-muted-foreground">
                      {selectedClient.lgpdConsent
                        ? 'Consentimento para tratamento de dados concedido'
                        : 'Consentimento pendente'
                      }
                    </span>
                  </div>
                  {!selectedClient.lgpdConsent && (
                    <Button variant="outline" size="sm" className="mt-3">
                      Solicitar Consentimento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                Selecione um cliente para ver os detalhes
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
