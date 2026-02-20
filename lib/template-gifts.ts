export type TemplateGiftItem = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  totalQuantity: number;
};

function toNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeTemplateGiftItems(input: unknown): TemplateGiftItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const row = item as Record<string, unknown>;
      const name = String(row.name || "").trim();
      const basePrice = Math.max(0.01, toNumber(row.basePrice, 0));
      const totalQuantity = Math.max(1, Math.floor(toNumber(row.totalQuantity, 1)));
      const description = row.description ? String(row.description).trim() : null;
      const imageUrl = row.imageUrl ? String(row.imageUrl).trim() : null;

      if (!name) return null;

      return {
        name,
        description,
        imageUrl,
        basePrice,
        totalQuantity,
      };
    })
    .filter(Boolean) as TemplateGiftItem[];
}

export function extractTemplateGiftItemsFromBlocks(blocks: unknown): TemplateGiftItem[] {
  if (!Array.isArray(blocks)) return [];

  for (const block of blocks as Array<Record<string, unknown>>) {
    if (block.type !== "gifts") continue;
    const config = (block.config || {}) as Record<string, unknown>;
    return normalizeTemplateGiftItems(config.templateGiftItems);
  }

  return [];
}
