export type RegistrarAvailabilityResult = {
  domain: string;
  available: boolean | null;
  error?: string;
  registrar: 'VERCEL';
};

export type RegistrarRegistrationResult = {
  ok: boolean;
  registrar: 'VERCEL';
  mode: 'prepared';
  message: string;
};

async function checkVercelAvailability(domain: string): Promise<RegistrarAvailabilityResult> {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || process.env.VERCEL_ORG_ID?.trim();

  if (!token) {
    return { domain, available: null, error: 'VERCEL_API_TOKEN nao configurado', registrar: 'VERCEL' };
  }

  const url = new URL(`https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/availability`);
  if (teamId) url.searchParams.set('teamId', teamId);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    return { domain, available: null, error: `Vercel ${response.status}`, registrar: 'VERCEL' };
  }

  const data = await response.json();
  return { domain, available: Boolean(data?.available), registrar: 'VERCEL' };
}

export async function checkRegistrarAvailability(domain: string) {
  return checkVercelAvailability(domain);
}

export async function prepareRegistrarRegistration(params: { domain: string; userId: string; giftListId: string }) {
  const availability = await checkVercelAvailability(params.domain);
  if (availability.available === false) {
    return {
      ok: false,
      registrar: 'VERCEL' as const,
      mode: 'prepared' as const,
      message: 'Dominio indisponivel no registrador.',
    };
  }

  return {
    ok: true,
    registrar: 'VERCEL' as const,
    mode: 'prepared' as const,
    message: 'Integracao preparada para registrar automaticamente quando o fluxo de compra for habilitado.',
  };
}
