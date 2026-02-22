import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  buildGiftModelBlocks,
  buildGiftModelDescription,
  DEFAULT_GIFT_MODEL_CATEGORIES,
  extractGiftModelItemsFromBlocks,
  GIFT_MODEL_CATEGORY,
  hasGiftModelMarker,
  isGiftModelTemplate,
  normalizeGiftModelItems,
  normalizeGiftModelSlug,
  parseGiftModelSummary,
  type GiftModelItem,
} from '@/lib/gift-models';

type GiftModelTemplateRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  isActive: boolean;
  order: number;
  defaultBlocks: unknown;
};

function mapCategory(row: GiftModelTemplateRow) {
  const items = extractGiftModelItemsFromBlocks(row.defaultBlocks);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: parseGiftModelSummary(row.description),
    thumbnail: row.thumbnail,
    isActive: row.isActive,
    order: row.order,
    itemsCount: items.length,
  };
}

export async function ensureDefaultGiftModelCategories() {
  const maxOrder = await prisma.template.aggregate({ _max: { order: true } });
  let nextOrder = (maxOrder._max.order ?? 0) + 1;

  for (const category of DEFAULT_GIFT_MODEL_CATEGORIES) {
    const slug = normalizeGiftModelSlug(category.slug);
    if (!slug) continue;

    const existing = await prisma.template.findUnique({
      where: { slug },
      select: { id: true, category: true, description: true },
    });

    if (existing) {
      const isLegacyGiftModel =
        existing.category?.toLowerCase() !== GIFT_MODEL_CATEGORY &&
        hasGiftModelMarker(existing.description);

      if (isLegacyGiftModel) {
        await prisma.template.update({
          where: { id: existing.id },
          data: { category: GIFT_MODEL_CATEGORY },
        });
      }
      continue;
    }

    try {
      await prisma.template.create({
        data: {
          name: category.name,
          slug,
          description: buildGiftModelDescription(category.summary),
          category: GIFT_MODEL_CATEGORY,
          thumbnail: null,
          defaultBlocks: buildGiftModelBlocks([]),
          defaultTheme: {},
          isActive: true,
          order: nextOrder,
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
    }

    nextOrder += 1;
  }
}

export async function listGiftModelTemplates() {
  await ensureDefaultGiftModelCategories();

  const rows = await prisma.template.findMany({
    where: {
      OR: [
        { category: GIFT_MODEL_CATEGORY },
        { description: { startsWith: '__GIFT_MODEL__' } },
      ],
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      thumbnail: true,
      isActive: true,
      order: true,
      defaultBlocks: true,
    },
  });

  return rows.filter((row) => isGiftModelTemplate(row)).map((row) => mapCategory(row));
}

export async function getGiftModelTemplateBySlug(rawSlug: string) {
  const slug = normalizeGiftModelSlug(rawSlug);
  if (!slug) return null;

  await ensureDefaultGiftModelCategories();

  const row = await prisma.template.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      thumbnail: true,
      isActive: true,
      order: true,
      defaultBlocks: true,
    },
  });

  if (!row || !isGiftModelTemplate(row)) return null;

  if (row.category.toLowerCase() !== GIFT_MODEL_CATEGORY && hasGiftModelMarker(row.description)) {
    await prisma.template.update({
      where: { id: row.id },
      data: { category: GIFT_MODEL_CATEGORY },
    });
  }

  const items = extractGiftModelItemsFromBlocks(row.defaultBlocks);

  return {
    ...mapCategory(row),
    items,
  };
}

export async function saveGiftModelItems(templateId: string, items: GiftModelItem[]) {
  const normalized = normalizeGiftModelItems(items);
  const blocks = buildGiftModelBlocks(normalized);

  return prisma.template.update({
    where: { id: templateId },
    data: {
      defaultBlocks: blocks,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      thumbnail: true,
      isActive: true,
      order: true,
      defaultBlocks: true,
    },
  });
}
