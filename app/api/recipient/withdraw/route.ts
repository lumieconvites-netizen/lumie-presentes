import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRecipientBalanceSummary } from "@/lib/pagarme";
import { createRecipientTransferWithGateway } from "@/lib/withdraw-gateway";
import { getActingUserContext } from "@/lib/acting-user";

const WITHDRAW_FEE_CENTS = 367;

function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith("pending_");
}

export async function POST() {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const recipient = await prisma.recipient.findUnique({
      where: { userId: ctx.effectiveUserId },
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

    const netAmount = Math.max(availableBalance - WITHDRAW_FEE_CENTS, 0);
    if (netAmount <= 0) {
      return NextResponse.json(
        {
          error:
            "Saldo insuficiente para saque apos desconto da taxa de transferencia.",
          debug: {
            availableBalanceInCents: availableBalance,
            waitingFundsInCents: waitingFunds,
            feeInCents: WITHDRAW_FEE_CENTS,
          },
        },
        { status: 400 }
      );
    }

    const transfer = await createRecipientTransferWithGateway({
      recipientId: recipient.pagarmeRecipientId,
      amountInCents: netAmount,
      metadata: {
        source: "lumie_dashboard_withdraw",
        userId: ctx.effectiveUserId,
      },
    });

    return NextResponse.json({
      message: `Saque solicitado com sucesso. Valor solicitado: R$ ${(availableBalance / 100).toFixed(
        2
      )}. Valor liquido estimado: R$ ${(netAmount / 100).toFixed(2)}.`,
      transferId: transfer?.id ?? null,
      amountInCents: netAmount,
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
