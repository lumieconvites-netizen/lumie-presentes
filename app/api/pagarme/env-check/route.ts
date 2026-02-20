import { NextResponse } from "next/server";
import { getActingUserContext } from "@/lib/acting-user";

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Nao autenticado" }, { status: 401 });
  }

  const gatewayUrl = process.env.WITHDRAW_GATEWAY_URL?.trim() ?? "";
  const gatewayToken = process.env.WITHDRAW_GATEWAY_TOKEN?.trim() ?? "";
  const pagarmeSecret = process.env.PAGARME_SECRET_KEY?.trim() ?? "";

  return NextResponse.json({
    ok: true,
    checks: {
      hasPagarmeSecretKey: pagarmeSecret.length > 0,
      hasWithdrawGatewayUrl: gatewayUrl.length > 0,
      hasWithdrawGatewayToken: gatewayToken.length > 0,
      gatewayUrlHost: gatewayUrl ? new URL(gatewayUrl).host : null,
    },
  });
}
