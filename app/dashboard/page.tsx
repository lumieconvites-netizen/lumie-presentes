'use client';

import { useUser } from '@/contexts/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Gift,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { gifts, messages, payments, settings } = useUser();

  const totalGifts = gifts.length;
  const activeGifts = gifts.filter(g => g.quantityAvailable > 0).length;
  const totalMessages = messages.length;
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.netAmount, 0);

  const recentPayments = payments.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display text-foreground mb-2">Dashboard</h1>
        <p className="text-gray-500">
          Visão geral da sua lista de presentes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Arrecadado
            </CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {payments.filter(p => p.status === 'paid').length} pagamentos aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Presentes
            </CardTitle>
            <Gift className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeGifts}/{totalGifts}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Disponíveis / Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recados
            </CardTitle>
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalMessages}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {messages.filter(m => m.isPublic).length} públicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {settings.published ? 'Publicada' : 'Rascunho'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {settings.published ? 'Visível para convidados' : 'Não visível'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pagamentos Recentes</span>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/pagamentos">Ver todos</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum pagamento ainda
            </p>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{payment.guestName}</p>
                      <p className="text-sm text-gray-500">{payment.giftTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {payment.netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/presentes">
                <Gift className="w-6 h-6" />
                Adicionar Presente
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/editor">
                <Calendar className="w-6 h-6" />
                Editar Página
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/preview">
                <Users className="w-6 h-6" />
                Ver Lista Pública
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
