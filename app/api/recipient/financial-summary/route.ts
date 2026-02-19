import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecipientFinancialSummaryWithGateway } from "@/lib/withdraw-gateway";

function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith("pending_");
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const recipient = await prisma.recipient.findUnique({
      where: { userId: session.user.id },
      select: {
        pagarmeRecipientId: true,
        status: true,
      },
    });

    if (!recipient || !isRealRecipientId(recipient.pagarmeRecipientId)) {
      return NextResponse.json(
        {
          hasRecipient: false,
          summary: {
            available: 0,
            waitingFunds: 0,
            pendingTransferAmount: 0,
            pendingTransferCount: 0,
            completedTransferAmount: 0,
            nonFailedTransferAmount: 0,
            nonFailedTransferCount: 0,
            latestPendingTransfer: null,
          },
        },
        { status: 200 }
      );
    }

    const summary = await getRecipientFinancialSummaryWithGateway(recipient.pagarmeRecipientId);

    return NextResponse.json(
      {
        hasRecipient: true,
        recipientStatus: recipient.status,
        summary,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao consultar resumo financeiro." },
      { status: 500 }
    );
  }
}
