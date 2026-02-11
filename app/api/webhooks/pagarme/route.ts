// /app/api/webhooks/pagarme/route.ts
import { NextResponse } from "next/server";
import { validateWebhookSignature, mapOrderStatus } from "@/lib/pagarme";

// se você já tem prisma aqui, pode manter
// import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const ok = validateWebhookSignature({ rawBody, headers: request.headers });
  if (!ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Exemplo de payload: event.type, event.data.id etc
  const type = event?.type as string | undefined;

  // ⚠️ aqui você vai mapear pros seus models no Supabase/Prisma depois
  // exemplo:
  // if (type === "order.paid") { ... }

  // só pra evitar build reclamando de unused:
  mapOrderStatus(event?.data?.status);

  return NextResponse.json({ received: true });
}
