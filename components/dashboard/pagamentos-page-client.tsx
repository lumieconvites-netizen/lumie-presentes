'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export type OrderRow = {
  id: string;
  guestName: string;
  guestEmail?: string | null;
  totalAmount: number | string;
  feeAmount: number | string;
  status: 'PENDING' | 'PAID' | 'AUTHORIZED' | 'REFUSED' | 'REFUNDED' | 'CHARGEBACK';
  createdAt: string;
  giftItem?: { id: string; name: string } | null;
};

export default function PagamentosPageClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders] = useState<OrderRow[]>(initialOrders);

  const statusIcons = {
    PAID: <CheckCircle className="w-5 h-5 text-green-600" />,
    AUTHORIZED: <CheckCircle className="w-5 h-5 text-green-600" />,
    PENDING: <Clock className="w-5 h-5 text-yellow-600" />,
    REFUSED: <XCircle className="w-5 h-5 text-red-600" />,
    REFUNDED: <XCircle className="w-5 h-5 text-red-600" />,
    CHARGEBACK: <XCircle className="w-5 h-5 text-red-600" />,
  };

  const statusLabels = {
    PAID: 'Pago',
    AUTHORIZED: 'Autorizado',
    PENDING: 'Pendente',
    REFUSED: 'Recusado',
    REFUNDED: 'Estornado',
    CHARGEBACK: 'Chargeback',
  };

  const successfulOrders = useMemo(
    () => orders.filter((order) => order.status === 'PAID' || order.status === 'AUTHORIZED'),
    [orders]
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-foreground mb-2">Pagamentos</h1>
        <p className="text-gray-500">Historico de pagamentos recebidos</p>
      </div>

      <div className="space-y-4">
        {successfulOrders.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-gray-500">Nenhum pagamento aprovado ainda.</CardContent>
          </Card>
        ) : (
          successfulOrders.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {statusIcons[payment.status]}
                      <h3 className="font-medium text-foreground">{payment.guestName}</h3>
                      <Badge variant={payment.status === 'PAID' || payment.status === 'AUTHORIZED' ? 'default' : 'secondary'}>
                        {statusLabels[payment.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{payment.guestEmail || '-'}</p>
                    <p className="text-sm text-gray-600">{payment.giftItem?.name || 'Presente'}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-green-600">
                      {(Number(payment.totalAmount) - Number(payment.feeAmount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Taxa: {Number(payment.feeAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(payment.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
