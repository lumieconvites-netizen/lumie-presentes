import { prisma } from '@/lib/prisma';

export function normalizeRequestHost(host?: string | null) {
  const value = String(host || '').trim().toLowerCase();
  if (!value) return '';
  return value.replace(/:\d+$/, '').replace(/\.$/, '');
}

export async function resolvePublishedGiftListByDomain(domain: string) {
  const normalized = normalizeRequestHost(domain);
  if (!normalized) return null;

  return prisma.customDomain.findFirst({
    where: {
      domain: normalized,
      status: 'ACTIVE',
      giftList: { isPublished: true },
    },
    select: {
      domain: true,
      giftList: {
        include: {
          user: { select: { name: true, image: true, plan: true, planExpiresAt: true } },
          pageLayout: true,
          gifts: { orderBy: { order: 'asc' } },
          messages: { orderBy: { createdAt: 'desc' } },
          rsvpSettings: true,
        },
      },
    },
  });
}

export async function resolveActiveCustomDomainHost(host?: string | null) {
  const normalized = normalizeRequestHost(host);
  if (!normalized) return null;
  return resolvePublishedGiftListByDomain(normalized);
}
