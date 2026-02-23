"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type BankAccountForm = {
  holderName: string;
  holderDocument: string;
  bankCode: string;
  agency: string;
  agencyDigit: string;
  accountNumber: string;
  accountDigit: string;
  accountType: "conta_corrente" | "conta_poupanca";
};

const initialState: BankAccountForm = {
  holderName: "",
  holderDocument: "",
  bankCode: "",
  agency: "",
  agencyDigit: "",
  accountNumber: "",
  accountDigit: "",
  accountType: "conta_corrente",
};

export default function BancoDashboardPage() {
  const [form, setForm] = useState<BankAccountForm>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/recipient/bank-account", { cache: "no-store" });
        const data = await res.json();
        const bankAccount = data?.recipient?.bankAccount as Partial<BankAccountForm> | undefined;

        if (bankAccount) {
          setForm({
            holderName: bankAccount.holderName ?? "",
            holderDocument: bankAccount.holderDocument ?? "",
            bankCode: bankAccount.bankCode ?? "",
            agency: bankAccount.agency ?? "",
            agencyDigit: bankAccount.agencyDigit ?? "",
            accountNumber: bankAccount.accountNumber ?? "",
            accountDigit: bankAccount.accountDigit ?? "",
            accountType: bankAccount.accountType === "conta_poupanca" ? "conta_poupanca" : "conta_corrente",
          });
          setStatus(data?.recipient?.status ?? null);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/recipient/bank-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao salvar");
      setStatus(data?.recipient?.status ?? "pending");
      alert(data?.warning ?? data?.message ?? "Dados bancarios salvos com sucesso.");
    } catch (error: any) {
      alert(error?.message ?? "Erro ao salvar dados bancarios.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4 md:p-6">Carregando dados bancarios...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-foreground mb-2">Conta Bancaria</h1>
        <p className="text-gray-500">Cadastre a conta para receber os valores dos presentes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados para repasse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Titular</label>
            <Input value={form.holderName} onChange={(e) => setForm((p) => ({ ...p, holderName: e.target.value }))} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">CPF/CNPJ</label>
            <Input value={form.holderDocument} onChange={(e) => setForm((p) => ({ ...p, holderDocument: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Código do banco</label>
              <Input value={form.bankCode} onChange={(e) => setForm((p) => ({ ...p, bankCode: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Agencia</label>
              <Input value={form.agency} onChange={(e) => setForm((p) => ({ ...p, agency: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Digito agencia</label>
              <Input value={form.agencyDigit} onChange={(e) => setForm((p) => ({ ...p, agencyDigit: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Conta</label>
              <Input value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Digito conta</label>
              <Input value={form.accountDigit} onChange={(e) => setForm((p) => ({ ...p, accountDigit: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <select
                className="w-full border rounded-md h-10 px-3 text-sm"
                value={form.accountType}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    accountType: e.target.value === "conta_poupanca" ? "conta_poupanca" : "conta_corrente",
                  }))
                }
              >
                <option value="conta_corrente">Conta corrente</option>
                <option value="conta_poupanca">Conta poupanca</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Status atual de validação: <strong>{status ?? "não enviado"}</strong>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Salvando..." : "Salvar dados bancarios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
