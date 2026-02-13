// components/site/SiteRenderer.tsx

'use client';

import React from 'react';

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

export default function SiteRenderer({
  list,
  blocks,
  theme,
  gifts,
  messages,
}: SiteRendererProps) {

  return (
    <div className="min-h-screen bg-background">

      {/* HERO */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold">{list.title}</h1>
        {list.description && (
          <p className="mt-4 text-gray-500">{list.description}</p>
        )}
      </section>

      {/* GIFTS */}
      <section className="container mx-auto py-12">
        <h2 className="text-2xl font-semibold mb-6">Lista de Presentes</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {gifts.map((gift) => (
            <div key={gift.id} className="border rounded-lg p-4">
              {gift.imageUrl && (
                <img
                  src={gift.imageUrl}
                  alt={gift.name}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
              )}
              <h3 className="font-medium">{gift.name}</h3>
              <p className="text-sm text-gray-500">{gift.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MESSAGES */}
      <section className="container mx-auto py-12">
        <h2 className="text-2xl font-semibold mb-6">Mural de Recados</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className="border rounded-lg p-4">
              <p className="font-medium">{msg.guestName}</p>
              <p className="text-sm mt-2">{msg.content}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
