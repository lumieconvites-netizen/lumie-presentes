export const GIFT_MODEL_CATEGORY = 'catalogo-presentes';
export const GIFT_MODEL_MARKER = '__GIFT_MODEL__';

export type GiftModelCategorySeed = {
  name: string;
  slug: string;
  summary: string;
};

export type GiftModelItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  totalQuantity: number;
};

export const DEFAULT_GIFT_MODEL_CATEGORIES: GiftModelCategorySeed[] = [
  {
    name: 'Presentes de 15 anos',
    slug: 'presentes-15-anos',
    summary: 'Sugestoes para festas de 15 anos.',
  },
  {
    name: 'Presentes de casamento',
    slug: 'presentes-casamento',
    summary: 'Sugestoes para listas de casamento.',
  },
  {
    name: 'Presentes infantis de menina',
    slug: 'presentes-infantis-menina',
    summary: 'Sugestoes para festas infantis de menina.',
  },
  {
    name: 'Presentes infantis de menino',
    slug: 'presentes-infantis-menino',
    summary: 'Sugestoes para festas infantis de menino.',
  },
];

function toNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function makeItemId(index: number) {
  return `item-${index + 1}`;
}

export function buildGiftModelDescription(summary?: string | null) {
  const text = safeString(summary);
  return text ? `${GIFT_MODEL_MARKER}\n${text}` : GIFT_MODEL_MARKER;
}

export function parseGiftModelSummary(description?: string | null) {
  const raw = safeString(description);
  if (!raw.startsWith(GIFT_MODEL_MARKER)) return '';
  return raw.replace(GIFT_MODEL_MARKER, '').trim();
}

export function isGiftModelTemplate(template: { category?: string | null; description?: string | null }) {
  const category = safeString(template.category).toLowerCase();
  return category === GIFT_MODEL_CATEGORY && safeString(template.description).startsWith(GIFT_MODEL_MARKER);
}

export function normalizeGiftModelSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function normalizeGiftModelItems(input: unknown): GiftModelItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      const row = item as Record<string, unknown>;
      const name = safeString(row.name);
      if (!name) return null;

      const basePrice = Math.min(400, Math.max(50, toNumber(row.basePrice, 50)));
      const totalQuantity = Math.max(1, Math.floor(toNumber(row.totalQuantity, 1)));
      const description = safeString(row.description) || null;
      const imageUrl = safeString(row.imageUrl) || null;
      const id = safeString(row.id) || makeItemId(index);

      return {
        id,
        name,
        description,
        imageUrl,
        basePrice,
        totalQuantity,
      };
    })
    .filter(Boolean) as GiftModelItem[];
}

export function extractGiftModelItemsFromBlocks(blocks: unknown): GiftModelItem[] {
  if (!Array.isArray(blocks)) return [];

  for (const block of blocks as Array<Record<string, unknown>>) {
    if (block.type !== 'gifts') continue;
    const config = (block.config || {}) as Record<string, unknown>;
    return normalizeGiftModelItems(config.templateGiftItems);
  }

  return [];
}

export function buildGiftModelBlocks(items: GiftModelItem[]) {
  return [
    {
      id: 'gift-models-block',
      type: 'gifts',
      order: 1,
      enabled: true,
      config: {
        templateGiftItems: items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          imageUrl: item.imageUrl || '',
          basePrice: item.basePrice,
          totalQuantity: item.totalQuantity,
        })),
      },
    },
  ];
}
