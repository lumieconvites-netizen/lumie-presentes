import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRecipientTransfer, getRecipientBalanceSummary } from "@/lib/pagarme";

const WITHDRAW_FEE_CENTS = 367;

function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith("pending_");
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const recipient = await prisma.recipient.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        pagarmeRecipientId: true,
        status: true,
      },
    });

    if (!recipient || !isRealRecipientId(recipient.pagarmeRecipientId)) {
      return NextResponse.json(
        { error: "Cadastre e sincronize sua conta bancaria antes de sacar." },
        { status: 400 }
      );
    }

    if (recipient.status !== "active") {
      return NextResponse.json(
        { error: "Sua conta bancaria ainda nao esta ativa para saque." },
        { status: 400 }
      );
    }

    const { available: availableBalance, waitingFunds } = await getRecipientBalanceSummary(
      recipient.pagarmeRecipientId
    );

    if (!Number.isFinite(availableBalance) || availableBalance <= 0) {
      if (waitingFunds > 0) {
        return NextResponse.json(
          {
            error: `Voce possui R$ ${(waitingFunds / 100).toFixed(
              2
            )} em processamento, mas ainda sem saldo liberado para saque.`,
            debug: {
              availableBalanceInCents: availableBalance,
              waitingFundsInCents: waitingFunds,
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Sem saldo disponivel para saque no momento.",
          debug: {
            availableBalanceInCents: availableBalance,
            waitingFundsInCents: waitingFunds,
          },
        },
        { status: 400 }
      );
    }

    if (availableBalance <= WITHDRAW_FEE_CENTS) {
      return NextResponse.json(
        {
          error:
            "Saldo insuficiente para saque. E necessario ter valor maior que R$ 3,67 por causa da taxa de transferencia.",
          debug: {
            availableBalanceInCents: availableBalance,
            waitingFundsInCents: waitingFunds,
          },
        },
        { status: 400 }
      );
    }

    const transfer = await createRecipientTransfer({
      recipientId: recipient.pagarmeRecipientId,
      amountInCents: availableBalance,
      metadata: {
        source: "lumie_dashboard_withdraw",
        userId: session.user.id,
      },
    });

    const netAmount = Math.max(availableBalance - WITHDRAW_FEE_CENTS, 0);

    return NextResponse.json({
      message: `Saque solicitado com sucesso. Valor solicitado: R$ ${(availableBalance / 100).toFixed(
        2
      )}. Valor liquido estimado: R$ ${(netAmount / 100).toFixed(2)}.`,
      transferId: transfer?.id ?? null,
      amountInCents: availableBalance,
      estimatedNetAmountInCents: netAmount,
      feeInCents: WITHDRAW_FEE_CENTS,
    });
  } catch (error: any) {
    console.error("Erro ao solicitar saque:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao solicitar saque." },
      { status: 500 }
    );
  }
}
