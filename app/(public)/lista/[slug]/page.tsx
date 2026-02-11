import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function PublicGiftListPage({ params }: PageProps) {
  const giftList = await prisma.giftList.findUnique({
    where: { 
      slug: params.slug,
      isPublished: true,
    },
    include: {
      gifts: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      messages: {
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!giftList) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-terracota-50 via-white to-gold-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-terracota-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="relative w-24 h-12">
            <Image
              src="/logo.png"
              alt="LUMIÊ"
              fill
              className="object-contain"
            />
          </div>
          <div className="text-sm text-terracota-600">
            Lista de {giftList.user.name}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-terracota-700 mb-4">
            {giftList.title}
          </h1>
          {giftList.description && (
            <p className="text-xl text-terracota-600 max-w-2xl mx-auto">
              {giftList.description}
            </p>
          )}
          {giftList.eventDate && (
            <p className="text-lg text-muted-foreground mt-4">
              {new Date(giftList.eventDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center text-terracota-700 mb-12">
            Como funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-terracota-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-terracota-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-terracota-700 mb-2">
                1. Escolha um presente
              </h3>
              <p className="text-muted-foreground">
                Navegue pela lista e escolha o presente que deseja dar
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-terracota-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-terracota-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-terracota-700 mb-2">
                2. Faça o pagamento
              </h3>
              <p className="text-muted-foreground">
                Pague de forma segura com cartão ou Pix
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-terracota-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-terracota-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-terracota-700 mb-2">
                3. Deixe um recado
              </h3>
              <p className="text-muted-foreground">
                Envie uma mensagem carinhosa junto com seu presente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de presentes */}
      <section className="py-16" id="presentes">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-center text-terracota-700 mb-12">
            Presentes
          </h2>

          {giftList.gifts.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">
                Nenhum presente cadastrado ainda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {giftList.gifts.map((gift) => (
                <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Imagem */}
                  <div className="relative h-56 bg-gradient-to-br from-terracota-100 to-gold-100">
                    {gift.imageUrl ? (
                      <Image
                        src={gift.imageUrl}
                        alt={gift.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-6xl">
                        🎁
                      </div>
                    )}
                    
                    {gift.availableQty === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          ESGOTADO
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <CardContent className="p-6">
                    <h3 className="font-display text-2xl font-bold text-terracota-700 mb-2">
                      {gift.name}
                    </h3>
                    
                    {gift.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {gift.description}
                      </p>
                    )}

                    <div className="mb-4">
                      <div className="text-3xl font-display font-bold text-terracota-600">
                        {formatCurrency(Number(gift.basePrice))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {gift.availableQty > 0
                          ? `${gift.availableQty} disponível(eis)`
                          : 'Esgotado'}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="w-full bg-terracota-500 hover:bg-terracota-600"
                      disabled={gift.availableQty === 0}
                    >
                      <Link href={`/lista/${params.slug}/presente/${gift.id}`}>
                        {gift.availableQty > 0 ? 'Presentear' : 'Esgotado'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recados */}
      {giftList.allowMessages && giftList.messages.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-4xl font-bold text-center text-terracota-700 mb-12">
              Recados dos Convidados
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {giftList.messages.map((message) => (
                <Card key={message.id} className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-terracota-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-terracota-600">
                        {message.guestName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-terracota-700">
                        {message.guestName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {message.content}
                  </p>
                  {message.signature && (
                    <p className="text-xs text-terracota-600 mt-2 italic">
                      — {message.signature}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-terracota-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="relative w-32 h-16 mx-auto mb-4">
            <Image
              src="/logo.png"
              alt="LUMIÊ"
              fill
              className="object-contain brightness-0 invert"
            />
          </div>
          <p className="text-terracota-200 mb-4">
            Transforme seus presentes em realizações
          </p>
          <Link
            href="/"
            className="text-terracota-300 hover:text-white underline"
          >
            Criar minha lista gratuita
          </Link>
        </div>
      </footer>
    </div>
  );
}
