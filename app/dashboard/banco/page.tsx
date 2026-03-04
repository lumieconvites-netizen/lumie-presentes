"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BankInstitutionCombobox from "@/components/account/bank-institution-combobox";
import {
  getBankNameByCode,
  isSupportedBankCode,
  normalizeBankCode,
} from "@/lib/bank-institutions";

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
  const { data: session } = useSession();
  const [form, setForm] = useState<BankAccountForm>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  const sessionRole = (session?.user as any)?.role as string | undefined;

  useEffect(() => {
    const load = async () => {
      try {
        const bankRequest = fetch("/api/recipient/bank-account", { cache: "no-store" });
        const affiliateModeRequest =
          sessionRole === "PARTNER" || sessionRole === "AMBASSADOR"
            ? fetch("/api/affiliate/impersonation", { cache: "no-store" })
            : Promise.resolve(null);

        const [res, affiliateModeRes] = await Promise.all([bankRequest, affiliateModeRequest]);
        const data = await res.json();
        const bankAccount = data?.recipient?.bankAccount as Partial<BankAccountForm> | undefined;

        if (affiliateModeRes?.ok) {
          const affiliateMode = await affiliateModeRes.json().catch(() => null);
          setReadOnly(Boolean(affiliateMode?.isImpersonating));
        } else {
          setReadOnly(false);
        }

        if (bankAccount) {
          setForm({
            holderName: bankAccount.holderName ?? "",
            holderDocument: bankAccount.holderDocument ?? "",
            bankCode: normalizeBankCode(bankAccount.bankCode ?? ""),
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
  }, [sessionRole]);

  async function handleSave() {
    if (readOnly) {
      return;
    }

    const normalizedBankCode = normalizeBankCode(form.bankCode);
    if (!isSupportedBankCode(normalizedBankCode)) {
      alert("Código do banco inválido. Selecione uma instituição da lista.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/recipient/bank-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          bankCode: normalizedBankCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao salvar");
      setStatus(data?.recipient?.status ?? "pending");
      const feedback = [
        data?.warning ?? data?.message ?? "Dados bancários salvos com sucesso.",
        data?.gatewayDetails ? `Gateway: ${data.gatewayDetails}` : null,
        data?.fallbackDetails ? `Fallback Pagar.me: ${data.fallbackDetails}` : null,
        !data?.gatewayDetails && !data?.fallbackDetails ? data?.details : null,
      ]
        .filter(Boolean)
        .join("\n\n");
      alert(feedback);
    } catch (error: any) {
      alert(error?.message ?? "Erro ao salvar dados bancários.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4 md:p-6">Carregando dados bancários...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-foreground mb-2">Conta Bancária</h1>
        <p className="text-gray-500">
          {readOnly
            ? "Visualize os dados bancários cadastrados para este cliente."
            : "Cadastre a conta para receber os valores dos presentes."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados para repasse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-semibold">Atenção ao preencher os dados bancários</p>
            <p>
              Preencha com máxima atenção. Qualquer erro pode causar falha na transferência bancária e cobrança
              indevida de tarifa pela instituição financeira.
            </p>
            <p className="mt-1">
              O CPF/CNPJ e o titular devem ser exatamente os mesmos da conta bancária informada.
            </p>
            <p className="mt-1">
              Não é permitido cadastrar conta bancária em nome de menor de 18 anos. Use apenas uma conta de titular
              maior de idade.
            </p>
          </div>

          {readOnly ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              Você está em modo de visualização. Parceiros e embaixadores podem apenas consultar os dados bancários do
              cliente, sem alterar nenhuma informação.
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium mb-2 block">Titular</label>
            <Input
              value={form.holderName}
              onChange={(e) => setForm((p) => ({ ...p, holderName: e.target.value }))}
              placeholder="Ex.: Maria da Silva Souza"
              readOnly={readOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">CPF/CNPJ</label>
            <Input
              value={form.holderDocument}
              onChange={(e) => setForm((p) => ({ ...p, holderDocument: e.target.value }))}
              placeholder="Ex.: 12345678901 ou 12345678000199"
              readOnly={readOnly}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use apenas o documento do titular da conta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Instituição financeira</label>
              {readOnly ? (
                <Input
                  value={
                    isSupportedBankCode(form.bankCode)
                      ? `${normalizeBankCode(form.bankCode)} - ${getBankNameByCode(form.bankCode)}`
                      : form.bankCode
                  }
                  readOnly
                  placeholder="Banco não informado"
                />
              ) : (
                <BankInstitutionCombobox
                  value={form.bankCode}
                  onChange={(value) => setForm((p) => ({ ...p, bankCode: value }))}
                />
              )}
              {form.bankCode && !isSupportedBankCode(form.bankCode) ? (
                <p className="text-xs text-red-600 mt-2">
                  Código inválido. Selecione uma instituição oficial.
                </p>
              ) : null}
              {isSupportedBankCode(form.bankCode) ? (
                <p className="text-xs text-gray-500 mt-2">
                  Código selecionado: {normalizeBankCode(form.bankCode)} - {getBankNameByCode(form.bankCode)}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Agência</label>
              <Input
                value={form.agency}
                onChange={(e) => setForm((p) => ({ ...p, agency: e.target.value }))}
                placeholder="Ex.: 1234"
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Dígito agência</label>
              <Input
                value={form.agencyDigit}
                onChange={(e) => setForm((p) => ({ ...p, agencyDigit: e.target.value }))}
                placeholder="Ex.: 0 (se houver)"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Conta</label>
              <Input
                value={form.accountNumber}
                onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                placeholder="Ex.: 1234567"
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Dígito conta</label>
              <Input
                value={form.accountDigit}
                onChange={(e) => setForm((p) => ({ ...p, accountDigit: e.target.value }))}
                placeholder="Ex.: 8"
                readOnly={readOnly}
              />
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
                disabled={readOnly}
              >
                <option value="conta_corrente">Conta corrente</option>
                <option value="conta_poupanca">Conta poupança</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Status atual de validação: <strong>{status ?? "não enviado"}</strong>
          </div>

          {readOnly ? (
            <p className="text-sm text-gray-500">
              Apenas o titular da conta pode alterar esses dados no próprio painel.
            </p>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Salvando..." : "Salvar dados bancários"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
