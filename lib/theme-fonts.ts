const TITLE_FONT_VAR_MAP: Record<string, string> = {
  "Playfair Display": "var(--font-playfair)",
  "Cormorant Garamond": "var(--font-cormorant)",
  "Great Vibes": "var(--font-great-vibes)",
  "Dancing Script": "var(--font-dancing-script)",
  Allura: "var(--font-allura)",
  Poppins: "var(--font-poppins)",
  Montserrat: "var(--font-montserrat)",
};

const BODY_FONT_VAR_MAP: Record<string, string> = {
  Inter: "var(--font-inter)",
  Lato: "var(--font-lato)",
  "Open Sans": "var(--font-open-sans)",
  Roboto: "var(--font-roboto)",
  Nunito: "var(--font-nunito)",
  "Work Sans": "var(--font-work-sans)",
  Raleway: "var(--font-raleway)",
};

export function resolveThemeTitleFont(fontName?: string | null): string {
  const name = (fontName || "Cormorant Garamond").trim();
  return TITLE_FONT_VAR_MAP[name] || `"${name}"`;
}

export function resolveThemeBodyFont(fontName?: string | null): string {
  const name = (fontName || "Inter").trim();
  return BODY_FONT_VAR_MAP[name] || `"${name}"`;
}

