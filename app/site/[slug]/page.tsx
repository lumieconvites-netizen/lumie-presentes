// app/site/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SiteRenderer from "@/components/site/SiteRenderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteBySlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);

  const list = await prisma.giftList.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true, image: true } },
      pageLayout: true,
      gifts: { orderBy: { order: "asc" } },
      messages: { orderBy: { createdAt: "desc" } },
    },
  });

  // se não existe ou não está publicada, 404
  if (!list || !list.isPublished) return notFound();

  return (
    <SiteRenderer
      list={{
        id: list.id,
        slug: list.slug,
        title: list.title,
        description: list.description,
        eventDate: list.eventDate,
        hostName: list.user?.name ?? "",
        hostImage: list.user?.image ?? null,
      }}
blocks={
  Array.isArray(list.pageLayout?.blocks)
    ? (list.pageLayout?.blocks as any[])
    : []
}
theme={(list.pageLayout?.theme as any) ?? null}

      gifts={list.gifts}
      messages={list.messages}
    />
  );
}
