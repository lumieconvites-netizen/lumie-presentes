import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getTemplatePresetBySlug } from "@/lib/template-presets";

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

    const selectedTemplate = getTemplatePresetBySlug(verification.templateSlug);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: verification.name,
          password: verification.passwordHash,
          emailVerified: new Date(),
        },
        create: {
          email: normalizedEmail,
          name: verification.name ?? "Novo usuario",
          password: verification.passwordHash,
          emailVerified: new Date(),
        },
      });

      const giftList = await tx.giftList.upsert({
        where: { slug: `lista-${user.id}` },
        update: {
          title: selectedTemplate?.defaultTitle ?? "Minha Lista de Presentes",
          description: selectedTemplate?.defaultDescription ?? "Ajude a realizar nossos sonhos!",
        },
        create: {
          userId: user.id,
          slug: `lista-${user.id}`,
          title: selectedTemplate?.defaultTitle ?? "Minha Lista de Presentes",
          description: selectedTemplate?.defaultDescription ?? "Ajude a realizar nossos sonhos!",
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

    console.error("Erro ao confirmar email:", error);
    return NextResponse.json({ error: "Erro ao confirmar email" }, { status: 500 });
  }
}
