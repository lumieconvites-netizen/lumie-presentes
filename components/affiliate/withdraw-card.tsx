'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet } from 'lucide-react';

type FinancialSummary = {
  available: number;
};

const WITHDRAW_FEE_CENTS = 367;

export default function AffiliateWithdrawCard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/recipient/financial-summary', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok) setSummary(data?.summary ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const available = Math.max(0, Number(summary?.available ?? 0)) / 100;

  async function requestWithdraw() {
    if (withdrawing) return;
    try {
      setWithdrawing(true);
      const res = await fetch('/api/recipient/withdraw', { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? 'N?o foi poss?vel solicitar o saque.');
      alert(json?.message ?? 'Saque solicitado com sucesso.');
      setOpen(false);
      const summaryRes = await fetch('/api/recipient/financial-summary', { cache: 'no-store' });
      const summaryJson = await summaryRes.json().catch(() => null);
      if (summaryRes.ok) setSummary(summaryJson?.summary ?? null);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao solicitar saque.');
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Saldo dispon?vel</p>
            <p className="text-xl md:text-2xl font-bold">
              {loading
                ? '...'
                : available.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <Button
            className="bg-[#8e3d2c] hover:bg-[#7a3426] text-white w-full sm:w-auto"
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Efetuar saque
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar saque</DialogTitle>
            <DialogDescription>
              A taxa de transferencia e de{' '}
              {(WITHDRAW_FEE_CENTS / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              . Deseja continuar com o saque?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={withdrawing}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#8e3d2c] hover:bg-[#7a3426] text-white"
              onClick={requestWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? 'Solicitando...' : 'Confirmar saque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
