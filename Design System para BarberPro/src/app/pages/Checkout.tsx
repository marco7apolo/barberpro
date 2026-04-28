import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Plus, Trash2, CreditCard, QrCode, DollarSign } from 'lucide-react';

interface CartItem {
  id: number;
  service: string;
  price: number;
}

export function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, service: 'Corte Simples', price: 35 },
    { id: 2, service: 'Barba', price: 30 }
  ]);
  const [tip, setTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal + tip;

  const tipOptions = [
    { label: 'R$ 5', value: 5 },
    { label: 'R$ 10', value: 10 },
    { label: '10%', value: subtotal * 0.1 },
    { label: '15%', value: subtotal * 0.15 },
  ];

  const removeItem = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-['Playfair_Display'] text-primary mb-2">Checkout</h1>
        <p className="text-muted-foreground">Finalize o pagamento</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Serviços Selecionados</CardTitle>
            <Button variant="outline" size="sm">
              <Plus size={16} className="mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="mb-1">{item.service}</p>
                <p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum serviço adicionado
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gorjeta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {tipOptions.map((option, idx) => (
              <Button
                key={idx}
                variant={tip === option.value ? 'primary' : 'outline'}
                onClick={() => setTip(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-muted-foreground" />
            <input
              type="number"
              placeholder="Valor personalizado"
              value={tip || ''}
              onChange={(e) => setTip(Number(e.target.value))}
              className="flex-1 px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentMethod === 'pix' ? 'primary' : 'outline'}
              onClick={() => setPaymentMethod('pix')}
              className="h-24 flex-col gap-2"
            >
              <QrCode size={32} />
              <span>PIX</span>
            </Button>
            <Button
              variant={paymentMethod === 'card' ? 'primary' : 'outline'}
              onClick={() => setPaymentMethod('card')}
              className="h-24 flex-col gap-2"
            >
              <CreditCard size={32} />
              <span>Cartão</span>
            </Button>
          </div>

          {paymentMethod === 'pix' && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="w-48 h-48 mx-auto bg-white rounded-lg mb-3 flex items-center justify-center">
                <QrCode size={160} className="text-black" />
              </div>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code para pagar
              </p>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Número do cartão"
                className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Validade (MM/AA)"
                  className="px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  className="px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Gorjeta</span>
              <span>R$ {tip.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between text-xl">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <Button variant="primary" className="w-full" size="lg">
            Finalizar Pagamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
