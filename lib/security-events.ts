import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

type SecurityEventInput = {
  type: string;
  email?: string | null;
  userId?: string | null;
  request?: Request | null;
  route?: string | null;
  metadata?: Record<string, unknown> | null;
};

function normalizeEmail(email?: string | null) {
  const value = email?.trim().toLowerCase();
  return value || null;
}

export async function logSecurityEvent(input: SecurityEventInput) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: input.type,
        email: normalizeEmail(input.email),
        userId: input.userId ?? null,
        ip: input.request ? getRequestIp(input.request) : null,
        userAgent: input.request?.headers.get("user-agent")?.slice(0, 500) ?? null,
        route: input.route ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("Falha ao registrar evento de seguranca:", error);
  }
}
