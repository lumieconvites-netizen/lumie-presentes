export const CATEGORY_MARKER_PREFIX = "__CATEGORY_MARKER__:";
export const CATEGORY_META_SLUG_PREFIX = "cat-meta-";

export function normalizeCategorySlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildCategoryMarkerDescription(name: string) {
  return `${CATEGORY_MARKER_PREFIX}${name.trim()}`;
}

export function parseCategoryMarkerName(description?: string | null, fallback = "Categoria") {
  if (!description) return fallback;
  if (!description.startsWith(CATEGORY_MARKER_PREFIX)) return fallback;
  const parsed = description.slice(CATEGORY_MARKER_PREFIX.length).trim();
  return parsed || fallback;
}

export function categoryMetaTemplateSlug(categorySlug: string) {
  return `${CATEGORY_META_SLUG_PREFIX}${normalizeCategorySlug(categorySlug)}`;
}

export function isCategoryMetaTemplate(template: { slug?: string | null; description?: string | null }) {
  return (
    String(template.slug || "").startsWith(CATEGORY_META_SLUG_PREFIX) &&
    String(template.description || "").startsWith(CATEGORY_MARKER_PREFIX)
  );
}

export function prettyCategoryName(categorySlug: string) {
  const value = normalizeCategorySlug(categorySlug);
  if (!value) return "Categoria";
  return value
    .split("-")
    .filter(Boolean)
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(" ");
}
