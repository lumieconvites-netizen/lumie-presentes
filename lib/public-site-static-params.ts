import { prisma } from "@/lib/prisma";

type SiteSlugParam = {
  slug: string;
};

let publishedSiteParamsPromise: Promise<SiteSlugParam[]> | null = null;

export async function getPublishedSiteStaticParams(): Promise<SiteSlugParam[]> {
  if (!process.env.DATABASE_URL?.trim()) {
    return [];
  }

  if (!publishedSiteParamsPromise) {
    publishedSiteParamsPromise = prisma.giftList
      .findMany({
        where: { isPublished: true },
        select: { slug: true },
      })
      .then((rows) =>
        rows
          .map((row) => String(row.slug || "").trim())
          .filter(Boolean)
          .map((slug) => ({ slug }))
      )
      .catch((error) => {
        console.error("Failed to load published site slugs for static generation:", error);
        return [];
      });
  }

  return publishedSiteParamsPromise;
}
