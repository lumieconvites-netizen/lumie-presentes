// /lib/pagarme.ts
import crypto from "crypto";

const PAGARME_API_BASE = process.env.PAGARME_API_BASE ?? "https://api.pagar.me/core/v5";

// Use SEMPRE no server (route.ts / server actions)
function getApiKey() {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error("PAGARME_SECRET_KEY não configurada no .env");
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

/**
 * Webhook signature (best-effort) via HMAC SHA256.
 * O header exato pode variar por configuração/versão, então checamos alguns comuns.
 *
 * Configure:
 *  - PAGARME_WEBHOOK_SECRET
 */
export function validateWebhookSignature(opts: {
  rawBody: string;
  headers: Headers;
}): boolean {
  const secret = process.env.PAGARME_WEBHOOK_SECRET;
  if (!secret) {
    // Se você ainda não configurou segredo de webhook, NÃO bloqueia em dev.
    // Em produção, recomendo configurar e retornar false se faltar.
    return process.env.NODE_ENV !== "production";
  }

  const rawSig =
    opts.headers.get("x-hub-signature-256") ||
    opts.headers.get("x-hub-signature") ||
    opts.headers.get("x-webhook-signature") ||
    opts.headers.get("pagarme-signature") ||
    opts.headers.get("signature");

  if (!rawSig) return false;

  // alguns providers mandam "sha256=...."
  const received = rawSig.replace(/^sha256=/i, "").trim();

  const expected = crypto.createHmac("sha256", secret).update(opts.rawBody, "utf8").digest("hex");

  // timing-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
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
    // importante pra evitar cache maluco em serverless
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Pagar.me error ${res.status}: ${txt}`);
  }

  return (await res.json()) as T;
}

// Exemplo mínimo pra você evoluir depois (pix/cartão/checkout etc)
export async function getOrder(orderId: string) {
  return pagarmeFetch<any>(`/orders/${orderId}`, { method: "GET" });
}
