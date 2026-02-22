import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeGuestName } from "@/lib/rsvp";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 10_000;
const CACHE_MAX_ENTRIES = 500;
type PublicRsvpSearchItem = {
  id: string;
  fullName: string;
  adultLimit: number;
  childLimit: number;
  status: string;
  confirmedAdults: number | null;
  confirmedChildren: number | null;
};

const responseCache = new Map<string, { expiresAt: number; payload: { results: PublicRsvpSearchItem[]; count: number } }>();

function cacheKey(slug: string, q: string) {
  return `${slug}::${q.toLowerCase()}`;
}

function readCache(key: string) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return hit.payload;
}

function writeCache(key: string, payload: { results: PublicRsvpSearchItem[]; count: number }) {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const first = responseCache.keys().next();
    if (!first.done) responseCache.delete(first.value);
  }
  responseCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    payload,
  });
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const startedAt = Date.now();
    const slug = decodeURIComponent(params.slug);
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const ip = getRequestIp(req);

    const rate = await enforceRateLimit({
      key: `rsvp:public:search:${slug}:${ip}`,
      requests: 120,
      window: "1 m",
    });
    if (!rate.allowed) {
      return NextResponse.json({ error: "Muitas buscas. Tente novamente em instantes." }, { status: 429 });
    }

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const key = cacheKey(slug, q);
    const cached = readCache(key);
    if (cached) return NextResponse.json(cached);

    const list = await prisma.giftList.findUnique({
      where: { slug },
      select: {
        id: true,
        isPublished: true,
        rsvpSettings: {
          select: {
            enabled: true,
          },
        },
      },
    });

    if (!list || !list.isPublished || !list.rsvpSettings?.enabled) {
      return NextResponse.json({ results: [] });
    }

    const normalizedQ = normalizeGuestName(q);

    const guests = await prisma.rsvpGuest.findMany({
      where: {
        giftListId: list.id,
        status: "PENDING",
        fullName: {
          contains: q,
          mode: "insensitive",
        },
      },
      orderBy: [{ fullName: "asc" }],
      take: 60,
      select: {
        id: true,
        fullName: true,
        adultLimit: true,
        childLimit: true,
        status: true,
        confirmedAdults: true,
        confirmedChildren: true,
      },
    });

    const results = guests.filter((guest) => normalizeGuestName(guest.fullName).includes(normalizedQ)).slice(0, 20);
    const payload = {
      results,
      count: results.length,
    };
    writeCache(key, payload);

    const elapsed = Date.now() - startedAt;
    if (elapsed > 1000) {
      console.warn("[rsvp-search] slow request", { slug, qLength: q.length, elapsedMs: elapsed, resultCount: results.length });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Erro ao buscar convidados publicos RSVP:", error);
    return NextResponse.json({ error: "Erro ao buscar convidados" }, { status: 500 });
  }
}
