type RegistrarName = 'VERCEL';

export type RegistrarAvailabilityResult = {
  domain: string;
  available: boolean | null;
  error?: string;
  registrar: RegistrarName;
};

export type RegistrarRegistrationResult = {
  ok: boolean;
  registrar: RegistrarName;
  mode: 'prepared' | 'executed';
  message: string;
  orderId?: string | null;
  verified?: boolean;
  orderStatus?: string | null;
};

type RegistrarContactInformation = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

function getTeamId() {
  return process.env.VERCEL_TEAM_ID?.trim() || process.env.VERCEL_ORG_ID?.trim() || undefined;
}

function getBearerToken() {
  return process.env.VERCEL_API_TOKEN?.trim() || '';
}

function getProjectIdOrName() {
  return (
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_PROJECT_NAME?.trim() ||
    'lumie-presentes'
  );
}

function getProjectSlug() {
  return process.env.VERCEL_TEAM_SLUG?.trim() || undefined;
}

function getRegistrarContactInformation(): RegistrarContactInformation | null {
  const contact = {
    firstName: process.env.VERCEL_DOMAIN_CONTACT_FIRST_NAME?.trim() || '',
    lastName: process.env.VERCEL_DOMAIN_CONTACT_LAST_NAME?.trim() || '',
    email: process.env.VERCEL_DOMAIN_CONTACT_EMAIL?.trim() || '',
    phone: process.env.VERCEL_DOMAIN_CONTACT_PHONE?.trim() || '',
    address1: process.env.VERCEL_DOMAIN_CONTACT_ADDRESS1?.trim() || '',
    city: process.env.VERCEL_DOMAIN_CONTACT_CITY?.trim() || '',
    state: process.env.VERCEL_DOMAIN_CONTACT_STATE?.trim() || '',
    zip: process.env.VERCEL_DOMAIN_CONTACT_ZIP?.trim() || '',
    country: process.env.VERCEL_DOMAIN_CONTACT_COUNTRY?.trim() || '',
  };

  const missing = Object.values(contact).some((value) => !value);
  return missing ? null : contact;
}

async function vercelRequest(pathname: string, init?: RequestInit, query?: Record<string, string | undefined>) {
  const token = getBearerToken();
  if (!token) {
    return new Response(JSON.stringify({ error: 'VERCEL_API_TOKEN nao configurado' }), { status: 500 });
  }

  const url = new URL(`https://api.vercel.com${pathname}`);
  const teamId = getTeamId();
  if (teamId) url.searchParams.set('teamId', teamId);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}

export function isRegistrarPurchaseConfigured() {
  return Boolean(getBearerToken() && getRegistrarContactInformation());
}

export async function checkRegistrarAvailability(domain: string): Promise<RegistrarAvailabilityResult> {
  const response = await vercelRequest(`/v1/registrar/domains/${encodeURIComponent(domain)}/availability`);
  if (!response.ok) {
    return { domain, available: null, error: `Vercel ${response.status}`, registrar: 'VERCEL' };
  }

  const data = await response.json();
  return { domain, available: Boolean(data?.available), registrar: 'VERCEL' };
}

export async function getRegistrarDomainPrice(domain: string, years = 1) {
  const response = await vercelRequest(
    `/v1/registrar/domains/${encodeURIComponent(domain)}/price`,
    undefined,
    { years: String(years) }
  );
  if (!response.ok) {
    throw new Error(`Falha ao consultar preco do dominio (${response.status}).`);
  }
  return response.json();
}

export async function buyRegistrarDomain(domain: string, years = 1) {
  const contactInformation = getRegistrarContactInformation();
  if (!contactInformation) {
    throw new Error('Contato do registrador nao configurado.');
  }

  const price = await getRegistrarDomainPrice(domain, years);
  const response = await vercelRequest(`/v1/registrar/domains/${encodeURIComponent(domain)}/buy`, {
    method: 'POST',
    body: JSON.stringify({
      autoRenew: false,
      years,
      expectedPrice: price?.purchasePrice,
      contactInformation,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao comprar dominio (${response.status}) ${text}`.trim());
  }

  return response.json();
}

export async function getRegistrarOrder(orderId: string) {
  const response = await vercelRequest(`/v1/registrar/orders/${encodeURIComponent(orderId)}`);
  if (!response.ok) {
    throw new Error(`Falha ao consultar pedido do dominio (${response.status}).`);
  }
  return response.json();
}

export async function addDomainToProject(domain: string) {
  const response = await vercelRequest(
    `/v10/projects/${encodeURIComponent(getProjectIdOrName())}/domains`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: domain,
      }),
    },
    getProjectSlug() ? { slug: getProjectSlug() } : undefined
  );

  if (response.status === 400) {
    const text = await response.text();
    if (/already exists/i.test(text)) {
      return getProjectDomain(domain);
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao adicionar dominio ao projeto (${response.status}) ${text}`.trim());
  }

  return response.json();
}

export async function getProjectDomain(domain: string) {
  const response = await vercelRequest(
    `/v9/projects/${encodeURIComponent(getProjectIdOrName())}/domains/${encodeURIComponent(domain)}`,
    undefined,
    getProjectSlug() ? { slug: getProjectSlug() } : undefined
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao consultar dominio no projeto (${response.status}) ${text}`.trim());
  }

  return response.json();
}

export async function prepareRegistrarRegistration(params: { domain: string; userId: string; giftListId: string }) {
  const availability = await checkRegistrarAvailability(params.domain);
  if (availability.available === false) {
    return {
      ok: false,
      registrar: 'VERCEL' as const,
      mode: 'prepared' as const,
      message: 'Dominio indisponivel no registrador.',
    };
  }

  if (!isRegistrarPurchaseConfigured()) {
    return {
      ok: true,
      registrar: 'VERCEL' as const,
      mode: 'prepared' as const,
      message: 'Automacao de compra pronta, aguardando configuracao dos dados de contato do registrador.',
    };
  }

  return {
    ok: true,
    registrar: 'VERCEL' as const,
    mode: 'prepared' as const,
    message: 'Integracao pronta para registrar automaticamente este dominio.',
  };
}
