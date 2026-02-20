import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ADMIN_IMPERSONATION_COOKIE = "lumie_admin_act_as";

type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "CLIENT" | "PARTNER" | "AMBASSADOR";
};

export type ActingUserContext = {
  sessionUserId: string;
  sessionUserRole: "ADMIN" | "CLIENT" | "PARTNER" | "AMBASSADOR";
  effectiveUserId: string;
  effectiveUser: SafeUser;
  isImpersonating: boolean;
};

function isValidUserId(value: string) {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(value);
}

export async function getActingUserContext(): Promise<ActingUserContext | null> {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  const sessionUserRole = ((session?.user as any)?.role ?? "CLIENT") as ActingUserContext["sessionUserRole"];

  if (!sessionUserId) {
    return null;
  }

  const sessionUser = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!sessionUser) {
    return null;
  }

  if (sessionUser.role !== "ADMIN") {
    return {
      sessionUserId,
      sessionUserRole: sessionUser.role,
      effectiveUserId: sessionUser.id,
      effectiveUser: sessionUser,
      isImpersonating: false,
    };
  }

  const actAsId = cookies().get(ADMIN_IMPERSONATION_COOKIE)?.value?.trim();
  if (!actAsId || !isValidUserId(actAsId) || actAsId === sessionUserId) {
    return {
      sessionUserId,
      sessionUserRole: "ADMIN",
      effectiveUserId: sessionUser.id,
      effectiveUser: sessionUser,
      isImpersonating: false,
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: actAsId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!targetUser || targetUser.role === "ADMIN") {
    return {
      sessionUserId,
      sessionUserRole: "ADMIN",
      effectiveUserId: sessionUser.id,
      effectiveUser: sessionUser,
      isImpersonating: false,
    };
  }

  return {
    sessionUserId,
    sessionUserRole: "ADMIN",
    effectiveUserId: targetUser.id,
    effectiveUser: targetUser,
    isImpersonating: true,
  };
}
