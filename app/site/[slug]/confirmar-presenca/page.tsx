import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ConfirmClient } from './confirm-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ConfirmarPresencaPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);

  const list = await prisma.giftList.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      isPublished: true,
      rsvpSettings: {
        select: {
          enabled: true,
          eventTitle: true,
          eventDateLabel: true,
          eventLocation: true,
          coverImageUrl: true,
          publicTitle: true,
          publicDescription: true,
          searchPlaceholder: true,
        },
      },
    },
  });

  if (!list || !list.isPublished) return notFound();

  if (!list.rsvpSettings?.enabled) {
    return (
      <main className="min-h-screen bg-[#faf7f5] flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">RSVP</p>
          <h1 className="text-3xl font-semibold mb-4">Confirmação ainda não liberada</h1>
          <p className="text-gray-600 mb-8">Os anfitriões ainda não abriram as confirmações de presença para este evento.</p>
          <a href={`/site/${encodeURIComponent(list.slug)}`} className="inline-flex px-5 py-3 rounded-lg bg-black text-white">
            Voltar para o site
          </a>
        </div>
      </main>
    );
  }

  return (
    <ConfirmClient
      slug={list.slug}
      eventTitle={list.rsvpSettings.eventTitle || list.title}
      eventDateLabel={list.rsvpSettings.eventDateLabel}
      eventLocation={list.rsvpSettings.eventLocation}
      coverImageUrl={list.rsvpSettings.coverImageUrl}
      publicTitle={list.rsvpSettings.publicTitle || "Confirmar Presença"}
      publicDescription={list.rsvpSettings.publicDescription || "Confirme sua presença no evento."}
      searchPlaceholder={list.rsvpSettings.searchPlaceholder || "Ex: Isabella"}
    />
  );
}

