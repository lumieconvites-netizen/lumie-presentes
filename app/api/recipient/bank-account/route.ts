import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRecipient, updateRecipientDefaultBankAccount } from "@/lib/pagarme";
import { z } from "zod";
import { getActingUserContext } from "@/lib/acting-user";
import { isSupportedBankCode, normalizeBankCode } from "@/lib/bank-institutions";

const bankAccountSchema = z.object({
  holderName: z.string().min(3, "Nome do titular invalido"),
  holderDocument: z.string().min(11, "CPF/CNPJ invalido"),
  bankCode: z.string().min(3, "Codigo do banco invalido"),
  agency: z.string().min(1, "Agencia obrigatoria"),
  agencyDigit: z.string().optional(),
  accountNumber: z.string().min(1, "Conta obrigatoria"),
  accountDigit: z.string().optional(),
  accountType: z.enum(["conta_corrente", "conta_poupanca"]),
});

function digitsOnly(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith("pending_");
}

function isRecipientNotFoundError(error: unknown) {
  const message = String((error as any)?.message ?? "").toLowerCase();
  return (
    message.includes("pagar.me error 404") ||
    (message.includes("recipient") && message.includes("not found")) ||
    (message.includes("recebedor") && message.includes("nao encontrado"))
  );
}

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const recipient = await prisma.recipient.findUnique({
    where: { userId: ctx.effectiveUserId },
    select: {
      id: true,
      pagarmeRecipientId: true,
      bankAccount: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ recipient });
}

export async function PUT(request: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bankAccountSchema.parse(body);
    const normalizedBankCode = normalizeBankCode(parsed.bankCode);
    if (!isSupportedBankCode(normalizedBankCode)) {
      return NextResponse.json(
        { error: "Codigo do banco invalido. Selecione uma instituicao oficial da lista." },
        { status: 400 }
      );
    }
    const bankAccount = {
      ...parsed,
      bankCode: normalizedBankCode,
    };

    const user = await prisma.user.findUnique({
      where: { id: ctx.effectiveUserId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const existingRecipient = await prisma.recipient.findUnique({
      where: { userId: ctx.effectiveUserId },
      select: { id: true, pagarmeRecipientId: true },
    });

    const hasRealRecipient = isRealRecipientId(existingRecipient?.pagarmeRecipientId);
    let nextRecipientId = existingRecipient?.pagarmeRecipientId ?? `pending_${ctx.effectiveUserId}`;
    let nextStatus = hasRealRecipient ? "active" : "pending";
    let warning: string | null = null;
    let message = "Dados bancarios salvos e sincronizados com sucesso.";

    const ownerDocument = digitsOnly(bankAccount.holderDocument);
    if (!ownerDocument) {
      warning = "Conta salva, mas CPF/CNPJ invalido para sincronizar na Pagar.me.";
      message = "Dados bancarios salvos. Sincronizacao pendente.";
    } else if (!process.env.PAGARME_SECRET_KEY) {
      warning = "Conta salva, mas Pagar.me nao esta configurada no ambiente.";
      message = "Dados bancarios salvos. Sincronizacao pendente.";
    } else {
      try {
        if (hasRealRecipient) {
          await updateRecipientDefaultBankAccount({
            recipientId: existingRecipient!.pagarmeRecipientId,
            bankAccount,
          });
          nextRecipientId = existingRecipient!.pagarmeRecipientId;
        } else {
          const created = await createRecipient({
            owner: {
              name: user.name?.trim() || bankAccount.holderName.trim(),
              email: user.email,
              document: ownerDocument,
            },
            bankAccount,
            metadata: {
              userId: user.id,
            },
          });
          nextRecipientId = created?.id ?? nextRecipientId;
        }
        nextStatus = "active";
      } catch (error: any) {
        console.error("Falha ao sincronizar recebedor na Pagar.me:", error);

        if (hasRealRecipient && isRecipientNotFoundError(error)) {
          try {
            const recreated = await createRecipient({
              owner: {
                name: user.name?.trim() || bankAccount.holderName.trim(),
                email: user.email,
                document: ownerDocument,
              },
              bankAccount,
              metadata: {
                userId: user.id,
                recreatedFromRecipientId: existingRecipient?.pagarmeRecipientId,
              },
            });

            nextRecipientId = recreated?.id ?? nextRecipientId;
            nextStatus = "active";
            warning = "Recebedor anterior nao encontrado na Pagar.me. Um novo recebedor foi criado e vinculado.";
            message = warning;
          } catch (recreateError: any) {
            console.error("Falha ao recriar recebedor na Pagar.me:", recreateError);
            warning =
              "Conta salva, mas a atualizacao dos dados bancarios na Pagar.me falhou e nao foi possivel recriar o recebedor.";
            message = "Dados bancarios salvos. Sincronizacao pendente.";
          }
        } else {
          warning = hasRealRecipient
            ? "Conta salva, mas a atualizacao dos dados bancarios na Pagar.me falhou. Tente novamente."
            : "Conta salva, mas a sincronizacao com a Pagar.me falhou temporariamente.";
          message = "Dados bancarios salvos. Sincronizacao pendente.";
        }
      }
    }

    const recipient = await prisma.recipient.upsert({
      where: { userId: ctx.effectiveUserId },
      create: {
        userId: ctx.effectiveUserId,
        pagarmeRecipientId: nextRecipientId,
        bankAccount: bankAccount as any,
        status: nextStatus,
      },
      update: {
        pagarmeRecipientId: nextRecipientId,
        bankAccount: bankAccount as any,
        status: nextStatus,
      },
      select: {
        id: true,
        pagarmeRecipientId: true,
        bankAccount: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message,
      warning,
      recipient,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao salvar dados bancarios:", error);
    return NextResponse.json({ error: "Erro ao salvar dados bancarios" }, { status: 500 });
  }
}
