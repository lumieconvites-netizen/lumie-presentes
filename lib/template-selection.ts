import { prisma } from "@/lib/prisma";
import { getTemplatePresetBySlug } from "@/lib/template-presets";
import { isCategoryMetaTemplate } from "@/lib/template-categories";

export type ResolvedSignupTemplate = {
  source: "db" | "preset";
  slug: string;
  templateId: string | null;
  defaultTitle: string;
  defaultDescription: string;
  blocks: any[];
  theme: Record<string, any>;
} | null;

export async function resolveSignupTemplateBySlug(slug?: string | null): Promise<ResolvedSignupTemplate> {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return null;

  const dbTemplate = await prisma.template.findUnique({
    where: { slug: normalized },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      defaultBlocks: true,
      defaultTheme: true,
      isActive: true,
    },
  });

  if (dbTemplate && !isCategoryMetaTemplate(dbTemplate)) {
    return {
      source: "db",
      slug: dbTemplate.slug,
      templateId: dbTemplate.id,
      defaultTitle: dbTemplate.name || "Minha Lista de Presentes",
      defaultDescription: dbTemplate.description || "Ajude a realizar nossos sonhos!",
      blocks: Array.isArray(dbTemplate.defaultBlocks) ? (dbTemplate.defaultBlocks as any[]) : [],
      theme: (dbTemplate.defaultTheme as Record<string, any>) || {},
    };
  }

  const preset = getTemplatePresetBySlug(normalized);
  if (!preset) return null;

  return {
    source: "preset",
    slug: preset.slug,
    templateId: null,
    defaultTitle: preset.defaultTitle ?? "Minha Lista de Presentes",
    defaultDescription: preset.defaultDescription ?? "Ajude a realizar nossos sonhos!",
    blocks: preset.blocks as any[],
    theme: preset.theme as Record<string, any>,
  };
}
