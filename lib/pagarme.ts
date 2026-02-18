import crypto from "crypto";

const PAGARME_API_BASE = process.env.PAGARME_API_BASE ?? "https://api.pagar.me/core/v5";

function getApiKey() {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error("PAGARME_SECRET_KEY nao configurada no .env");
  return key;
}

export type PagarmeOrderStatus =
  | "pending"
  | "paid"
  | "canceled"
  | "failed"
  | "refunded"
  | "processing"
  | "authorized"
  | "unknown";

export function mapOrderStatus(input: string | undefined | null): PagarmeOrderStatus {
  const s = (input ?? "").toLowerCase();
  if (!s) return "unknown";

  if (["paid"].includes(s)) return "paid";
  if (["pending", "waiting_payment"].includes(s)) return "pending";
  if (["canceled", "cancelled"].includes(s)) return "canceled";
  if (["failed"].includes(s)) return "failed";
  if (["refunded"].includes(s)) return "refunded";
  if (["processing"].includes(s)) return "processing";
  if (["authorized"].includes(s)) return "authorized";

  return "unknown";
}

function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function validateWebhookBasicAuth(headers: Headers): boolean {
  const expectedUser = process.env.PAGARME_WEBHOOK_BASIC_USER;
  const expectedPass = process.env.PAGARME_WEBHOOK_BASIC_PASSWORD;

  if (!expectedUser || !expectedPass) return false;

  const auth = headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("basic ")) return false;

  const encoded = auth.slice(6).trim();
  let decoded = "";

  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return false;
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return false;

  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}

function validateWebhookHmac(rawBody: string, headers: Headers): boolean {
  const secret = process.env.PAGARME_WEBHOOK_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const rawSig =
    headers.get("x-hub-signature-256") ||
    headers.get("x-hub-signature") ||
    headers.get("x-webhook-signature") ||
    headers.get("pagarme-signature") ||
    headers.get("signature");

  if (!rawSig) return false;

  const received = rawSig.replace(/^sha256=/i, "").trim();
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  return safeEqual(received, expected);
}

export function validateWebhookSignature(opts: { rawBody: string; headers: Headers }): boolean {
  // Prioridade 1: Basic Auth (painel novo da Pagar.me)
  if (process.env.PAGARME_WEBHOOK_BASIC_USER && process.env.PAGARME_WEBHOOK_BASIC_PASSWORD) {
    return validateWebhookBasicAuth(opts.headers);
  }

  // Prioridade 2: Assinatura HMAC
  return validateWebhookHmac(opts.rawBody, opts.headers);
}

async function pagarmeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  const res = await fetch(`${PAGARME_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Pagar.me error ${res.status}: ${txt}`);
  }

  return (await res.json()) as T;
}

export async function getOrder(orderId: string) {
  return pagarmeFetch<any>(`/orders/${orderId}`, { method: "GET" });
}

type PagarmeRecipientBalance = {
  available?: {
    amount?: number;
  };
  waiting_funds?: {
    amount?: number;
  };
  available_amount?: number;
  waiting_funds_amount?: number;
};

function readAmount(input: any): number {
  if (Array.isArray(input)) {
    return input.reduce((acc, item) => acc + readAmount(item), 0);
  }
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

export async function getRecipientBalanceSummary(recipientId: string): Promise<{
  available: number;
  waitingFunds: number;
}> {
  const balance = await pagarmeFetch<PagarmeRecipientBalance>(`/recipients/${recipientId}/balance`, {
    method: "GET",
  });
  const available =
    readAmount((balance as any)?.available) ||
    readAmount((balance as any)?.available_amount) ||
    readAmount((balance as any)?.balance?.available) ||
    readAmount((balance as any)?.balance?.available_amount);
  const waitingFunds =
    readAmount((balance as any)?.waiting_funds) ||
    readAmount((balance as any)?.waiting_funds_amount) ||
    readAmount((balance as any)?.balance?.waiting_funds) ||
    readAmount((balance as any)?.balance?.waiting_funds_amount);
  return {
    available,
    waitingFunds,
  };
}

export async function getRecipientAvailableBalance(recipientId: string): Promise<number> {
  const summary = await getRecipientBalanceSummary(recipientId);
  return summary.available;
}

type CreateTransferInput = {
  recipientId: string;
  amountInCents: number;
  metadata?: Record<string, any>;
};

export async function createRecipientTransfer(input: CreateTransferInput) {
  return pagarmeFetch<any>("/transfers", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountInCents,
      recipient_id: input.recipientId,
      metadata: input.metadata ?? {},
    }),
  });
}

type RecipientBankAccountInput = {
  holderName: string;
  holderDocument: string;
  bankCode: string;
  agency: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit?: string;
  accountType: "conta_corrente" | "conta_poupanca";
};

type RecipientOwnerInput = {
  name: string;
  email: string;
  document: string;
};

function digitsOnly(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function mapBankType(type: "conta_corrente" | "conta_poupanca") {
  return type === "conta_poupanca" ? "savings" : "checking";
}

function mapDocumentType(document: string) {
  return document.length > 11 ? "company" : "individual";
}

function buildDefaultBankAccount(input: RecipientBankAccountInput) {
  const document = digitsOnly(input.holderDocument);
  const holderType = mapDocumentType(document);
  return {
    holder_name: input.holderName.trim(),
    holder_type: holderType,
    holder_document: document,
    bank: digitsOnly(input.bankCode),
    branch_number: digitsOnly(input.agency),
    branch_check_digit: digitsOnly(input.agencyDigit) || null,
    account_number: digitsOnly(input.accountNumber),
    account_check_digit: digitsOnly(input.accountDigit) || null,
    type: mapBankType(input.accountType),
  };
}

export async function createRecipient(params: {
  owner: RecipientOwnerInput;
  bankAccount: RecipientBankAccountInput;
  metadata?: Record<string, any>;
}) {
  const ownerDocument = digitsOnly(params.owner.document);
  const ownerType = mapDocumentType(ownerDocument);
  const payload = {
    name: params.owner.name.trim(),
    email: params.owner.email.trim(),
    description: "Recebedor criado automaticamente pela plataforma LUMIÊ",
    document: ownerDocument,
    type: ownerType,
    default_bank_account: buildDefaultBankAccount(params.bankAccount),
    metadata: params.metadata ?? {},
  };

  return pagarmeFetch<any>("/recipients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRecipientDefaultBankAccount(params: {
  recipientId: string;
  bankAccount: RecipientBankAccountInput;
}) {
  const payload = buildDefaultBankAccount(params.bankAccount);

  return pagarmeFetch<any>(`/recipients/${params.recipientId}/default-bank-account`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

type CreatePixOrderInput = {
  amountInCents: number;
  itemTitle: string;
  quantity: number;
  splitRules?: Array<{
    recipientId: string;
    amountInCents: number;
  }>;
  customer: {
    name: string;
    email: string;
    document: string;
    areaCode: string;
    number: string;
  };
  metadata?: Record<string, any>;
};

export async function createPixOrder(input: CreatePixOrderInput) {
  const splitRules =
    input.splitRules && input.splitRules.length > 0
      ? input.splitRules.map((rule, index, arr) => ({
          type: "flat",
          amount: rule.amountInCents,
          recipient_id: rule.recipientId,
          options: {
            liable: true,
            // A Pagar.me exige ao menos 1 recebedor responsavel pela taxa de processamento.
            charge_processing_fee: index === arr.length - 1,
            // A Pagar.me exige ao menos 1 recebedor responsavel por remainder fee.
            // Mantemos o ultimo (plataforma) como responsavel.
            charge_remainder_fee: index === arr.length - 1,
          },
        }))
      : undefined;

  const payload = {
    items: [
      {
        amount: input.amountInCents,
        description: input.itemTitle,
        quantity: 1,
        code: `gift_${Date.now()}`,
      },
    ],
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      type: "individual",
      document: input.customer.document,
      phones: {
        mobile_phone: {
          country_code: "55",
          area_code: input.customer.areaCode,
          number: input.customer.number,
        },
      },
    },
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: 3600,
        },
        ...(splitRules ? { split: splitRules } : {}),
      },
    ],
    metadata: input.metadata ?? {},
  };

  return pagarmeFetch<any>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

type CreateCreditCardOrderInput = {
  amountInCents: number;
  itemTitle: string;
  quantity: number;
  splitRules?: Array<{
    recipientId: string;
    amountInCents: number;
  }>;
  customer: {
    name: string;
    email: string;
    document: string;
    areaCode: string;
    number: string;
  };
  card: {
    number: string;
    holderName: string;
    expMonth: string;
    expYear: string;
    cvv: string;
  };
  installments?: number;
  metadata?: Record<string, any>;
};

export async function createCreditCardOrder(input: CreateCreditCardOrderInput) {
  const billingAddress = {
    line_1: process.env.PAGARME_BILLING_LINE_1 ?? "Av Paulista, 1000",
    zip_code: process.env.PAGARME_BILLING_ZIP_CODE ?? "01310000",
    city: process.env.PAGARME_BILLING_CITY ?? "Sao Paulo",
    state: process.env.PAGARME_BILLING_STATE ?? "SP",
    country: process.env.PAGARME_BILLING_COUNTRY ?? "BR",
  };

  const splitRules =
    input.splitRules && input.splitRules.length > 0
      ? input.splitRules.map((rule, index, arr) => ({
          type: "flat",
          amount: rule.amountInCents,
          recipient_id: rule.recipientId,
          options: {
            liable: true,
            charge_processing_fee: index === arr.length - 1,
            charge_remainder_fee: index === arr.length - 1,
          },
        }))
      : undefined;

  const payload = {
    items: [
      {
        amount: input.amountInCents,
        description: input.itemTitle,
        quantity: 1,
        code: `gift_${Date.now()}`,
      },
    ],
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      type: "individual",
      document: input.customer.document,
      phones: {
        mobile_phone: {
          country_code: "55",
          area_code: input.customer.areaCode,
          number: input.customer.number,
        },
      },
    },
    payments: [
      {
        payment_method: "credit_card",
        credit_card: {
          installments: Math.max(1, Number(input.installments ?? 1)),
          statement_descriptor: "LUMIE",
          card: {
            number: input.card.number,
            holder_name: input.card.holderName,
            exp_month: input.card.expMonth,
            exp_year: input.card.expYear,
            cvv: input.card.cvv,
            billing_address: billingAddress,
          },
        },
        ...(splitRules ? { split: splitRules } : {}),
      },
    ],
    metadata: input.metadata ?? {},
  };

  return pagarmeFetch<any>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

