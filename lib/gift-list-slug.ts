function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isLegacyGiftListSlug(slug?: string | null) {
  const s = String(slug ?? "").trim().toLowerCase();
  return s.startsWith("lista-");
}

export function buildGiftListSlug(name: string | null | undefined, userId: string) {
  const base = slugify(name?.trim() || "lista");
  const shortId = String(userId).slice(-6).toLowerCase();
  const safeBase = base || "lista";
  return `${safeBase}-${shortId}`;
}

