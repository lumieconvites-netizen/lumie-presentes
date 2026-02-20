import { NextResponse } from "next/server";
import { getActingUserContext } from "@/lib/acting-user";

const PAGARME_API_BASE = process.env.PAGARME_API_BASE ?? "https://api.pagar.me/core/v5";

function getApiKey() {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error("PAGARME_SECRET_KEY nao configurada");
  return key;
}

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Nao autenticado" }, { status: 401 });
  }

  try {
    const apiKey = getApiKey();
    const res = await fetch(`${PAGARME_API_BASE}/transfers`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 1,
        recipient_id: "re_transfer_probe_invalid_recipient",
        metadata: {
          probe: true,
          source: "lumie_transfer_probe",
          userId: ctx.effectiveUserId,
        },
      }),
      cache: "no-store",
    });

    const raw = await res.text().catch(() => "");
    let parsed: any = raw;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      // keep raw text
    }

    return NextResponse.json(
      {
        ok: res.ok,
        provider: "pagarme",
        endpoint: "/transfers",
        status: res.status,
        result: parsed,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        provider: "pagarme",
        error: String(error?.message ?? "Erro no transfer probe"),
      },
      { status: 500 }
    );
  }
}
