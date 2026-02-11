'use client';

import { useUser } from '@/contexts/user-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default function PagamentosPage() {
  const { payments } = useUser();

  const statusIcons = {
    paid: <CheckCircle className="w-5 h-5 text-green-600" />,
    pending: <Clock className="w-5 h-5 text-yellow-600" />,
    refunded: <XCircle className="w-5 h-5 text-red-600" />
  };

  const statusLabels = {
    paid: 'Pago',
    pending: 'Pendente',
    refunded: 'Estornado'
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display text-foreground mb-2">Pagamentos</h1>
        <p className="text-gray-500">Histórico de pagamentos recebidos</p>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {statusIcons[payment.status]}
                    <h3 className="font-medium text-foreground">{payment.guestName}</h3>
                    <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                      {statusLabels[payment.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{payment.guestEmail}</p>
                  <p className="text-sm text-gray-600">{payment.giftTitle}</p>
                  {payment.message && (
                    <p className="text-sm text-gray-500 mt-2 italic">"{payment.message}"</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {payment.netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Taxa: {payment.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(payment.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
