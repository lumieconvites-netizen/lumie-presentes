import { prisma } from '@/lib/prisma';
import { normalizeCheckInSlug } from '@/lib/rsvp';

export function extractTokenOrCode(raw: string) {
  const value = raw.trim();
  if (!value) return { token: '', code: '' };

  try {
    const parsed = new URL(value);
    const token = parsed.searchParams.get('token') || '';
    if (token) {
      return { token: decodeURIComponent(token), code: '' };
    }
  } catch {
    // not an URL
  }

  const tokenMatch = value.match(/[?&]token=([^&]+)/i);
  if (tokenMatch?.[1]) {
    return { token: decodeURIComponent(tokenMatch[1]), code: '' };
  }

  return { token: '', code: value.toUpperCase() };
}

export async function findGiftListByCheckInSlug(inputSlug: string) {
  const slug = normalizeCheckInSlug(decodeURIComponent(inputSlug || ''));
  if (!slug) return null;

  return prisma.giftList.findFirst({
    where: {
      OR: [
        { rsvpSettings: { is: { checkInSlug: slug } } },
        { slug, rsvpSettings: { is: { checkInSlug: null } } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      isPublished: true,
      rsvpSettings: {
        select: {
          enabled: true,
          checkInEnabled: true,
          checkInSlug: true,
        },
      },
    },
  });
}

