import { createRecipientTransfer, getRecipientBalanceSummary, listRecipientTransfers } from "@/lib/pagarme";

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
  completedTransferAmount: number;
  nonFailedTransferAmount: number;
  nonFailedTransferCount: number;
  latestPendingTransfer: {
    id: string | null;
    status: string | null;
    amount: number;
    createdAt: string | null;
  } | null;
};

function readAmount(input: any): number {
  if (Array.isArray(input)) return input.reduce((acc, item) => acc + readAmount(item), 0);
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string") {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (input && typeof input === "object" && "amount" in input) {
    return readAmount((input as any).amount);
  }
  return 0;
}

function isPendingTransferStatus(status?: string | null): boolean {
  const s = String(status ?? "").toLowerCase();
  return [
    "pending",
    "processing",
    "created",
    "scheduled",
    "waiting_transfer",
    "pending_transfer",
    "requested",
  ].includes(s);
}

function isFailedTransferStatus(status?: string | null): boolean {
  const s = String(status ?? "").toLowerCase();
  return ["failed", "canceled", "cancelled", "error", "refused", "rejected", "reversed"].includes(s);
}

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
    const summary = await getSummaryViaGateway(recipientId);
    try {
      const transfers = await listRecipientTransfers(recipientId);
      const pendingTransfers = transfers.filter((transfer) =>
        isPendingTransferStatus(String(transfer?.status ?? ""))
      );
      const pendingTransferAmount = pendingTransfers.reduce(
        (sum, transfer) => sum + readAmount(transfer?.amount),
        0
      );
      const latestPendingTransfer = pendingTransfers
        .slice()
        .sort((a, b) => {
          const da = new Date(a?.created_at || a?.createdAt || 0).getTime();
          const db = new Date(b?.created_at || b?.createdAt || 0).getTime();
          return db - da;
        })[0];
      const completedTransferAmount = transfers
        .filter((transfer) => {
          const status = String(transfer?.status ?? "");
          return !isPendingTransferStatus(status) && !isFailedTransferStatus(status);
        })
        .reduce((sum, transfer) => sum + readAmount(transfer?.amount), 0);
      const nonFailedTransfers = transfers.filter((transfer) => !isFailedTransferStatus(String(transfer?.status ?? "")));
      const nonFailedTransferAmount = nonFailedTransfers.reduce(
        (sum, transfer) => sum + readAmount(transfer?.amount),
        0
      );

      return {
        ...summary,
        pendingTransferAmount,
        pendingTransferCount: pendingTransfers.length,
        completedTransferAmount,
        nonFailedTransferAmount,
        nonFailedTransferCount: nonFailedTransfers.length,
        latestPendingTransfer: latestPendingTransfer
          ? {
              id: latestPendingTransfer?.id ?? null,
              status: latestPendingTransfer?.status ?? null,
              amount: readAmount(latestPendingTransfer?.amount),
              createdAt: latestPendingTransfer?.created_at || latestPendingTransfer?.createdAt || null,
            }
          : null,
      };
    } catch {
      return {
        ...summary,
        completedTransferAmount: 0,
        nonFailedTransferAmount: 0,
        nonFailedTransferCount: 0,
      };
    }
  }

  const { available, waitingFunds } = await getRecipientBalanceSummary(recipientId);
  return {
    available,
    waitingFunds,
    pendingTransferAmount: 0,
    pendingTransferCount: 0,
    completedTransferAmount: 0,
    nonFailedTransferAmount: 0,
    nonFailedTransferCount: 0,
    latestPendingTransfer: null,
  };
}
