import { createRecipientTransfer, getRecipientBalanceSummary } from "@/lib/pagarme";

type CreateTransferInput = {
  recipientId: string;
  amountInCents: number;
  metadata?: Record<string, any>;
};

function readGatewayConfig() {
  const baseUrl = process.env.WITHDRAW_GATEWAY_URL?.trim() ?? "";
  const token = process.env.WITHDRAW_GATEWAY_TOKEN?.trim() ?? "";
  return { baseUrl, token };
}

async function createTransferViaGateway(input: CreateTransferInput) {
  const { baseUrl, token } = readGatewayConfig();
  if (!baseUrl) {
    throw new Error("WITHDRAW_GATEWAY_URL nao configurada");
  }
  if (!token) {
    throw new Error("WITHDRAW_GATEWAY_TOKEN nao configurada");
  }

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipientId: input.recipientId,
      amountInCents: input.amountInCents,
      metadata: input.metadata ?? {},
    }),
    cache: "no-store",
  });

  const raw = await res.text().catch(() => "");
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { raw };
  }

  if (!res.ok) {
    const msg =
      payload?.message ||
      payload?.error ||
      payload?.result?.message ||
      raw ||
      "Erro no withdraw gateway";
    throw new Error(`Withdraw gateway error ${res.status}: ${msg}`);
  }

  return payload;
}

export async function createRecipientTransferWithGateway(input: CreateTransferInput) {
  const { baseUrl } = readGatewayConfig();
  if (baseUrl) {
    return createTransferViaGateway(input);
  }

  return createRecipientTransfer(input);
}

type RecipientFinancialSummary = {
  available: number;
  waitingFunds: number;
  pendingTransferAmount: number;
  pendingTransferCount: number;
  latestPendingTransfer: {
    id: string | null;
    status: string | null;
    amount: number;
    createdAt: string | null;
  } | null;
};

async function getSummaryViaGateway(recipientId: string): Promise<RecipientFinancialSummary> {
  const { baseUrl, token } = readGatewayConfig();
  if (!baseUrl) throw new Error("WITHDRAW_GATEWAY_URL nao configurada");
  if (!token) throw new Error("WITHDRAW_GATEWAY_TOKEN nao configurada");

  const res = await fetch(
    `${baseUrl.replace(/\/+$/, "")}/recipient-summary/${encodeURIComponent(recipientId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const raw = await res.text().catch(() => "");
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { raw };
  }

  if (!res.ok) {
    const msg =
      payload?.message ||
      payload?.error ||
      payload?.result?.message ||
      raw ||
      "Erro ao consultar summary do gateway";
    throw new Error(`Withdraw gateway error ${res.status}: ${msg}`);
  }

  return payload?.summary ?? {};
}

export async function getRecipientFinancialSummaryWithGateway(
  recipientId: string
): Promise<RecipientFinancialSummary> {
  const { baseUrl } = readGatewayConfig();
  if (baseUrl) {
    return getSummaryViaGateway(recipientId);
  }

  const { available, waitingFunds } = await getRecipientBalanceSummary(recipientId);
  return {
    available,
    waitingFunds,
    pendingTransferAmount: 0,
    pendingTransferCount: 0,
    latestPendingTransfer: null,
  };
}
