import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ensureDefaultReferralCodesForUser, resolveReferralForSignup } from "@/lib/referrals";
import { buildGiftListSlug, isLegacyGiftListSlug } from "@/lib/gift-list-slug";
import { resolveSignupTemplateBySlug } from "@/lib/template-selection";

const verifySchema = z.object({
  email: z.string().email("Email invalido"),
  code: z.string().length(6, "Codigo invalido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = verifySchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        purpose: "REGISTER",
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: "Codigo expirado. Solicite um novo." }, { status: 400 });
    }

    if (!verification.passwordHash) {
      return NextResponse.json({ error: "Cadastro invalido. Refaça o cadastro." }, { status: 400 });
    }

    const selectedTemplate = await resolveSignupTemplateBySlug(verification.templateSlug);
    const requestedRole = verification.requestedRole === "PARTNER" ? "PARTNER" : "CLIENT";
    const referral = await resolveReferralForSignup({
      requestedRole,
      inviteCode: verification.inviteCode,
    });

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: verification.name,
          password: verification.passwordHash,
          emailVerified: new Date(),
          role: requestedRole,
          partnerAmbassadorId: referral.partnerAmbassadorId,
          referredByPartnerId: referral.referredByPartnerId,
          referredByAmbassadorId: referral.referredByAmbassadorId,
          acquisitionSource: referral.acquisitionSource,
          appliedReferralCode: referral.normalizedInviteCode,
        },
        create: {
          email: normalizedEmail,
          name: verification.name ?? "Novo usuario",
          password: verification.passwordHash,
          emailVerified: new Date(),
          role: requestedRole,
          partnerAmbassadorId: referral.partnerAmbassadorId,
          referredByPartnerId: referral.referredByPartnerId,
          referredByAmbassadorId: referral.referredByAmbassadorId,
          acquisitionSource: referral.acquisitionSource,
          appliedReferralCode: referral.normalizedInviteCode,
        },
      });

      await ensureDefaultReferralCodesForUser({
        id: user.id,
        role: user.role,
      }, tx);

      const existingGiftList = await tx.giftList.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      const defaultTitle = selectedTemplate?.defaultTitle ?? "Minha Lista de Presentes";
      const defaultDescription = selectedTemplate?.defaultDescription ?? "Ajude a realizar nossos sonhos!";
      const nextSlug = buildGiftListSlug(user.name, user.id);

      const giftList = existingGiftList
        ? await tx.giftList.update({
            where: { id: existingGiftList.id },
            data: {
              title: defaultTitle,
              description: defaultDescription,
              ...(selectedTemplate?.templateId ? { templateId: selectedTemplate.templateId } : {}),
              ...(isLegacyGiftListSlug(existingGiftList.slug) ? { slug: nextSlug } : {}),
            },
          })
        : await tx.giftList.create({
            data: {
              userId: user.id,
              slug: nextSlug,
              title: defaultTitle,
              description: defaultDescription,
              ...(selectedTemplate?.templateId ? { templateId: selectedTemplate.templateId } : {}),
            },
          });

      if (selectedTemplate) {
        await tx.pageLayout.upsert({
          where: { giftListId: giftList.id },
          update: {
            blocks: selectedTemplate.blocks as any,
            theme: selectedTemplate.theme as any,
          },
          create: {
            giftListId: giftList.id,
            blocks: selectedTemplate.blocks as any,
            theme: selectedTemplate.theme as any,
          },
        });

        if (selectedTemplate.giftItems.length > 0) {
          const giftCount = await tx.giftItem.count({ where: { giftListId: giftList.id } });
          if (giftCount === 0) {
            await tx.giftItem.createMany({
              data: selectedTemplate.giftItems.map((gift, index) => ({
                giftListId: giftList.id,
                name: gift.name,
                description: gift.description || null,
                imageUrl: gift.imageUrl || null,
                basePrice: gift.basePrice,
                totalQuantity: gift.totalQuantity,
                availableQty: gift.totalQuantity,
                isActive: true,
                order: index,
              })),
            });
          }
        }
      }

      await tx.emailVerificationCode.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      });
    });

    return NextResponse.json({ message: "Email confirmado com sucesso." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.toLowerCase().includes("codigo")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Erro ao confirmar email:", error);
    return NextResponse.json({ error: "Erro ao confirmar email" }, { status: 500 });
  }
}
