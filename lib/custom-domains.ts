export const SUPPORTED_DOMAIN_TLDS = ["com", "site", "net"] as const;

export type SupportedDomainTld = (typeof SUPPORTED_DOMAIN_TLDS)[number];

export function normalizeDomainLabel(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/\.[a-z0-9-]+$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function normalizeSupportedDomain(input: string) {
  const value = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const match = value.match(/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.(com|site|net)$/);
  return match ? `${match[1]}.${match[2]}` : null;
}

export function buildDomainSuggestions(input: string) {
  const label = normalizeDomainLabel(input);
  if (!label || label.length < 3) return [];
  return SUPPORTED_DOMAIN_TLDS.map((tld) => `${label}.${tld}`);
}

