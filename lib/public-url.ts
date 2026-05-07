const FALLBACK_PUBLIC_BASE_URL = 'https://lumieeventos.com';

export function getPlatformPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || FALLBACK_PUBLIC_BASE_URL).replace(/\/+$/, '');
}

export function buildGiftListPublicUrls(slug: string, customDomain?: string | null) {
  const safeSlug = encodeURIComponent(slug);
  const customBase = customDomain ? `https://${customDomain.replace(/\/+$/, '')}` : null;
  const platformBase = getPlatformPublicBaseUrl();
  const base = customBase || `${platformBase}/site/${safeSlug}`;

  return {
    siteUrl: base,
    giftsUrl: customBase ? `${customBase}/presentes` : `${platformBase}/site/${safeSlug}/presentes`,
    rsvpUrl: customBase ? `${customBase}/confirmar-presenca` : `${platformBase}/site/${safeSlug}/confirmar-presenca`,
  };
}
