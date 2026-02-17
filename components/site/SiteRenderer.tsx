'use client';

import PublicPageView from '@/components/public/PublicPageView';

interface SiteRendererProps {
  list: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    eventDate?: Date | null;
    hostName: string;
    hostImage?: string | null;
  };
  blocks: any[];
  theme: any;
  gifts: any[];
  messages: any[];
}

function mapGift(g: any) {
  return {
    id: g.id,
    title: g.name,
    description: g.description,
    value: Number(g.basePrice ?? 0),
    photo: g.imageUrl,
    quantity: g.totalQuantity,
    quantityAvailable: g.availableQty,
    status: g.isActive ? 'active' : 'inactive',
  };
}

function mapMessage(m: any) {
  return {
    id: m.id,
    guestName: m.guestName,
    message: m.content,
    date: m.createdAt,
    isPublic: m.isPublic,
    isFavorite: m.isFavorite,
  };
}

export default function SiteRenderer({ list, blocks, theme, gifts, messages }: SiteRendererProps) {
  return (
    <PublicPageView
      blocks={Array.isArray(blocks) ? blocks : []}
      gifts={(gifts ?? []).map(mapGift)}
      messages={(messages ?? []).map(mapMessage)}
      settings={{ slug: list?.slug }}
      theme={theme ?? {}}
    />
  );
}
