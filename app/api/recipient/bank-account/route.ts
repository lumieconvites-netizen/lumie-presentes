import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createRecipientWithGateway,
  updateRecipientDefaultBankAccountWithGateway,
} from "@/lib/withdraw-gateway";
import { z } from "zod";
import { getActingUserContext } from "@/lib/acting-user";
import {
  isSupportedBankCode,
  normalizeBankCode,
  normalizeRecipientTransferBankCode,
} from "@/lib/bank-institutions";

const bankAccountSchema = z.object({
  holderName: z.string().min(3, "Nome do titular invalido"),
  holderDocument: z.string().min(11, "CPF/CNPJ invalido"),
  holderBirthdate: z.string().optional(),
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

function isIndividualDocument(document: string) {
  return digitsOnly(document).length === 11;
}

function parseBirthdate(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function calculateAge(birthdate: Date, today = new Date()) {
  let age = today.getUTCFullYear() - birthdate.getUTCFullYear();
  const currentMonth = today.getUTCMonth();
  const birthMonth = birthdate.getUTCMonth();
  if (
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && today.getUTCDate() < birthdate.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

function formatBirthdate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith("pending_");
}

function normalizeGatewayHolderName(value: string) {
  const compact = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!compact) return compact;
  // O gateway exige menos de 30 caracteres neste campo.
  return compact.slice(0, 29);
}

function normalizeComparableHolderName(value?: string | null) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sanitizeRecipientSyncErrorDetails(input: unknown) {
  const message = String(input ?? "").trim();
  if (!message) return null;

  if (/<html|<!doctype|<\?xml/i.test(message)) {
    return "A Pagar.me retornou uma resposta invalida/temporaria. Tente novamente em alguns segundos.";
  }

  return message.length > 400 ? `${message.slice(0, 397)}...` : message;
}

function extractGatewayFallbackDetails(error: unknown) {
  return sanitizeRecipientSyncErrorDetails((error as any)?.gatewayFallback?.details);
}

function isRecipientNotFoundError(error: unknown) {
  const direct = String((error as any)?.message ?? "");
  const gatewayFallback = String((error as any)?.gatewayFallback?.details ?? "");
  const combined = `${direct}\n${gatewayFallback}`.toLowerCase();
  return combined.includes(" 404") || combined.includes("not found") || combined.includes("nao encontrado");
}

function normalizeRecipientStatus(input?: string | null) {
  const status = String(input ?? "").trim().toLowerCase();
  if (["active", "ativo", "approved", "enabled"].includes(status)) return "active";
  if (["refused", "rejected", "denied", "inactive", "disabled"].includes(status)) return "refused";
  if (["pending", "created", "processing", "waiting"].includes(status)) return "pending";
  return status || "active";
}

function isRefusedRecipientStatus(input?: string | null) {
  return normalizeRecipientStatus(input) === "refused";
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
    const ownerDocument = digitsOnly(bankAccount.holderDocument);
    const holderBirthdate = parseBirthdate(bankAccount.holderBirthdate);

    if (isIndividualDocument(ownerDocument)) {
      if (!holderBirthdate) {
        return NextResponse.json(
          { error: "Informe a data de nascimento do titular da conta." },
          { status: 400 }
        );
      }

      if (calculateAge(holderBirthdate) < 18) {
        return NextResponse.json(
          { error: "Nao e permitido cadastrar conta bancaria em nome de menor de 18 anos." },
          { status: 400 }
        );
      }
    }

    const normalizedBankAccount = {
      ...bankAccount,
      holderBirthdate: holderBirthdate ? formatBirthdate(holderBirthdate) : "",
    };
    const gatewayBankAccount = {
      ...normalizedBankAccount,
      bankCode: normalizeRecipientTransferBankCode(normalizedBankAccount.bankCode),
      holderName: normalizeGatewayHolderName(normalizedBankAccount.holderName),
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
      select: { id: true, pagarmeRecipientId: true, bankAccount: true, status: true },
    });

    const hasRealRecipient = isRealRecipientId(existingRecipient?.pagarmeRecipientId);
    const currentBankAccount = (existingRecipient?.bankAccount ?? null) as Record<string, any> | null;
    const holderDocumentChanged =
      digitsOnly(currentBankAccount?.holderDocument) &&
      digitsOnly(currentBankAccount?.holderDocument) !== ownerDocument;
    const holderNameChanged =
      normalizeComparableHolderName(currentBankAccount?.holderName) &&
      normalizeComparableHolderName(currentBankAccount?.holderName) !==
        normalizeComparableHolderName(bankAccount.holderName);
    const recipientWasRefused = isRefusedRecipientStatus(existingRecipient?.status);
    const shouldCreateNewRecipient =
      !hasRealRecipient ||
      Boolean(holderDocumentChanged) ||
      Boolean(holderNameChanged) ||
      Boolean(recipientWasRefused);
    let nextRecipientId = existingRecipient?.pagarmeRecipientId ?? `pending_${ctx.effectiveUserId}`;
    let nextStatus = hasRealRecipient ? existingRecipient?.status ?? "active" : "pending";
    let warning: string | null = null;
    let details: string | null = null;
    let gatewayDetails: string | null = null;
    let fallbackDetails: string | null = null;
    let message = "Dados bancarios salvos e sincronizados com sucesso.";

    if (!ownerDocument) {
      warning = "Conta salva, mas CPF/CNPJ invalido para sincronizar na Pagar.me.";
      message = "Dados bancarios salvos. Sincronizacao pendente.";
    } else if (!process.env.PAGARME_SECRET_KEY) {
      warning = "Conta salva, mas Pagar.me nao esta configurada no ambiente.";
      message = "Dados bancarios salvos. Sincronizacao pendente.";
    } else {
      try {
        if (hasRealRecipient && existingRecipient?.pagarmeRecipientId && !shouldCreateNewRecipient) {
          try {
            const updated = await updateRecipientDefaultBankAccountWithGateway({
              recipientId: existingRecipient.pagarmeRecipientId,
              bankAccount: gatewayBankAccount,
            });
            nextRecipientId = existingRecipient.pagarmeRecipientId;
            nextStatus = normalizeRecipientStatus(updated?.status);
          } catch (updateError) {
            if (!isRecipientNotFoundError(updateError)) {
              throw updateError;
            }

            const created = await createRecipientWithGateway({
              owner: {
                name: user.name?.trim() || normalizedBankAccount.holderName.trim(),
                email: user.email,
                document: ownerDocument,
              },
              bankAccount: gatewayBankAccount,
              metadata: {
                userId: user.id,
              },
            });
            nextRecipientId = created?.id ?? nextRecipientId;
            nextStatus = normalizeRecipientStatus(created?.status);
            warning =
              "Conta salva. O recebedor anterior nao foi encontrado na Pagar.me e um novo recebedor foi criado automaticamente.";
          }
        } else {
          const created = await createRecipientWithGateway({
            owner: {
              name: user.name?.trim() || normalizedBankAccount.holderName.trim(),
              email: user.email,
              document: ownerDocument,
            },
            bankAccount: gatewayBankAccount,
            metadata: {
              userId: user.id,
            },
          });
          nextRecipientId = created?.id ?? nextRecipientId;
          nextStatus = normalizeRecipientStatus(created?.status);
          if (recipientWasRefused) {
            warning =
              "Conta salva. Como o recebedor anterior foi recusado pela Pagar.me, um novo recebedor foi criado automaticamente.";
          }
        }
      } catch (error: any) {
        console.error("Falha ao sincronizar recebedor na Pagar.me:", error);
        gatewayDetails = extractGatewayFallbackDetails(error);
        fallbackDetails = sanitizeRecipientSyncErrorDetails(error?.message);
        details = fallbackDetails || gatewayDetails;
        nextStatus = "pending";
        warning = hasRealRecipient && !shouldCreateNewRecipient
          ? "Conta salva, mas a atualizacao dos dados bancarios no recebedor atual da Pagar.me falhou. Nenhum novo recebedor foi criado."
          : "Conta salva, mas a sincronizacao com a Pagar.me falhou temporariamente.";
        message = "Dados bancarios salvos. Sincronizacao pendente.";
      }
    }

    const recipient = await prisma.recipient.upsert({
      where: { userId: ctx.effectiveUserId },
      create: {
        userId: ctx.effectiveUserId,
        pagarmeRecipientId: nextRecipientId,
        bankAccount: normalizedBankAccount as any,
        status: nextStatus,
      },
      update: {
        pagarmeRecipientId: nextRecipientId,
        bankAccount: normalizedBankAccount as any,
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
      details,
      gatewayDetails,
      fallbackDetails,
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
