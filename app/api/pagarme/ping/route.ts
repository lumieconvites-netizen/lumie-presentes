import { NextResponse } from "next/server";
import { getRecipientBalanceSummary } from "@/lib/pagarme";
import { getActingUserContext } from "@/lib/acting-user";

export async function GET(request: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Nao autenticado" }, { status: 401 });
  }

  const platformRecipientId = process.env.PAGARME_PLATFORM_RECIPIENT_ID;
  if (!platformRecipientId) {
    return NextResponse.json(
      {
        ok: false,
        error: "PAGARME_PLATFORM_RECIPIENT_ID nao configurada",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedRecipientId = searchParams.get("recipientId");
  const recipientId = requestedRecipientId?.trim() || platformRecipientId;

  try {
    const summary = await getRecipientBalanceSummary(recipientId);
    return NextResponse.json({
      ok: true,
      provider: "pagarme",
      recipientId,
      usedPlatformRecipient: recipientId === platformRecipientId,
      summary,
    });
  } catch (error: any) {
    const rawMessage = String(error?.message ?? "Erro ao consultar Pagar.me");
    const statusMatch = rawMessage.match(/Pagar\.me error (\d+)/i);
    const status = statusMatch ? Number(statusMatch[1]) : 500;

    return NextResponse.json(
      {
        ok: false,
        provider: "pagarme",
        status,
        message: rawMessage,
      },
      { status }
    );
  }
}
