import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-terracota-50 via-white to-gold-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="font-display text-3xl font-bold text-terracota-700 mb-4">
            Presente confirmado! 🎉
          </h1>

          <p className="text-lg text-muted-foreground mb-6">
            Obrigado por presentear! Seu gesto será muito especial e significativo.
          </p>

          <div className="bg-terracota-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-terracota-700">
              Você receberá um email de confirmação com os detalhes do seu presente.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="bg-terracota-500 hover:bg-terracota-600"
            >
              <Link href={`/lista/${params.slug}`}>
                Voltar para a lista
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/">Conhecer a LUMIÊ</Link>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="relative w-24 h-12 mx-auto opacity-50">
              <Image
                src="/logo.png"
                alt="LUMIÊ"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
