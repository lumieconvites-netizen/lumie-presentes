import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ADMIN_IMPERSONATION_COOKIE = "lumie_admin_act_as";
export const AFFILIATE_IMPERSONATION_COOKIE = "lumie_affiliate_act_as";
export const EMPLOYEE_IMPERSONATION_COOKIE = "lumie_employee_act_as";

type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "ADMIN" | "CLIENT" | "PARTNER" | "AMBASSADOR" | "EMPLOYEE";
};

export type ActingUserContext = {
  sessionUserId: string;
  sessionUserRole: "ADMIN" | "CLIENT" | "PARTNER" | "AMBASSADOR" | "EMPLOYEE";
  effectiveUserId: string;
  effectiveUser: SafeUser;
  isImpersonating: boolean;
  impersonationMode: "ADMIN" | "AFFILIATE" | "EMPLOYEE" | null;
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
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  if (!sessionUser) {
    return null;
  }

  if (sessionUser.role !== "ADMIN") {
    if (sessionUser.role === "PARTNER" || sessionUser.role === "AMBASSADOR") {
      const affiliateActAsId = cookies().get(AFFILIATE_IMPERSONATION_COOKIE)?.value?.trim();
      if (affiliateActAsId && isValidUserId(affiliateActAsId) && affiliateActAsId !== sessionUserId) {
        const targetUser = await prisma.user.findFirst({
          where: {
            id: affiliateActAsId,
            role: "CLIENT",
            ...(sessionUser.role === "PARTNER"
              ? { referredByPartnerId: sessionUserId }
              : { referredByAmbassadorId: sessionUserId }),
          },
          select: { id: true, name: true, email: true, image: true, role: true },
        });

        if (targetUser) {
          return {
            sessionUserId,
            sessionUserRole: sessionUser.role,
            effectiveUserId: targetUser.id,
            effectiveUser: targetUser,
            isImpersonating: true,
            impersonationMode: "AFFILIATE",
          };
        }
      }
    }

    if (sessionUser.role === "EMPLOYEE") {
      const employeeActAsId = cookies().get(EMPLOYEE_IMPERSONATION_COOKIE)?.value?.trim();
      if (employeeActAsId && isValidUserId(employeeActAsId) && employeeActAsId !== sessionUserId) {
        const targetUser = await prisma.user.findFirst({
          where: {
            id: employeeActAsId,
            role: "CLIENT",
          },
          select: { id: true, name: true, email: true, image: true, role: true },
        });

        if (targetUser) {
          return {
            sessionUserId,
            sessionUserRole: sessionUser.role,
            effectiveUserId: targetUser.id,
            effectiveUser: targetUser,
            isImpersonating: true,
            impersonationMode: "EMPLOYEE",
          };
        }
      }
    }

    return {
      sessionUserId,
      sessionUserRole: sessionUser.role,
      effectiveUserId: sessionUser.id,
      effectiveUser: sessionUser,
      isImpersonating: false,
      impersonationMode: null,
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
      impersonationMode: null,
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: actAsId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  if (!targetUser || targetUser.role === "ADMIN") {
    return {
      sessionUserId,
      sessionUserRole: "ADMIN",
      effectiveUserId: sessionUser.id,
      effectiveUser: sessionUser,
      isImpersonating: false,
      impersonationMode: null,
    };
  }

  return {
    sessionUserId,
    sessionUserRole: "ADMIN",
    effectiveUserId: targetUser.id,
    effectiveUser: targetUser,
    isImpersonating: true,
    impersonationMode: "ADMIN",
  };
}
