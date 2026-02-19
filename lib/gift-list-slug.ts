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

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "cadastro",
  "checkout",
  "dashboard",
  "faq",
  "lgpd",
  "login",
  "privacidade",
  "recuperar-senha",
  "seja-parceiro",
  "site",
  "tarifas",
  "templates",
  "termos",
]);

export function isLegacyGiftListSlug(slug?: string | null) {
  const s = String(slug ?? "").trim().toLowerCase();
  return s.startsWith("lista-");
}

export function normalizeGiftListSlugInput(value?: string | null) {
  return slugify(String(value ?? ""));
}

export function validateGiftListSlug(value?: string | null): { ok: true } | { ok: false; error: string } {
  const slug = normalizeGiftListSlugInput(value);

  if (!slug) {
    return { ok: false, error: "Informe uma URL valida." };
  }
  if (slug.length < 3) {
    return { ok: false, error: "A URL deve ter pelo menos 3 caracteres." };
  }
  if (slug.length > 50) {
    return { ok: false, error: "A URL deve ter no maximo 50 caracteres." };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Use apenas letras, numeros e hifen." };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: "Essa URL e reservada. Escolha outra." };
  }

  return { ok: true };
}

export function buildGiftListSlug(name: string | null | undefined, userId: string) {
  const base = slugify(name?.trim() || "lista");
  const shortId = String(userId).slice(-6).toLowerCase();
  const safeBase = base || "lista";
  return `${safeBase}-${shortId}`;
}
