import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Reports() {
  const revenueData = [
    { month: 'Jan', value: 12500 },
    { month: 'Fev', value: 15200 },
    { month: 'Mar', value: 14800 },
    { month: 'Abr', value: 18900 },
  ];

  const servicesData = [
    { name: 'Corte + Barba', value: 45 },
    { name: 'Corte Simples', value: 30 },
    { name: 'Barba', value: 15 },
    { name: 'Platinado', value: 10 },
  ];

  const COLORS = ['#ffd700', '#22c55e', '#3b82f6', '#a855f7'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Relatórios</h1>
        <p className="text-muted-foreground">Análise de desempenho do negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">Faturamento (Mês)</p>
            <p className="text-3xl text-success mb-1">R$ 18.900</p>
            <p className="text-xs text-muted-foreground">+27% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">Atendimentos (Mês)</p>
            <p className="text-3xl text-primary mb-1">287</p>
            <p className="text-xs text-muted-foreground">+15% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">Ticket Médio</p>
            <p className="text-3xl text-info mb-1">R$ 68,00</p>
            <p className="text-xs text-muted-foreground">+8% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2d2d2d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#ffd700" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={servicesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {servicesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2d2d2d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Barbeiros (Faturamento)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'João Santos', revenue: 7200, growth: 12 },
              { name: 'Pedro Costa', revenue: 5800, growth: 8 },
              { name: 'Lucas Silva', revenue: 4100, growth: -3 },
              { name: 'André Mendes', revenue: 1800, growth: 25 },
            ].map((barber, idx) => (
              <div key={barber.name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                      {idx + 1}
                    </span>
                    <span>{barber.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-success">R$ {barber.revenue.toFixed(2)}</p>
                    <p className={`text-xs ${barber.growth > 0 ? 'text-success' : 'text-destructive'}`}>
                      {barber.growth > 0 ? '+' : ''}{barber.growth}%
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(barber.revenue / 7200) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
