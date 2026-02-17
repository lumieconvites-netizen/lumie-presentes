import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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

