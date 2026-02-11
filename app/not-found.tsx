import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF4EF] via-white to-[#F1E3D6] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative w-32 h-16 mx-auto mb-8">
          <Image
            src="/logo.png"
            alt="LUMIÊ"
            fill
            className="object-contain"
          />
        </div>

        <div className="text-8xl font-display font-bold text-primary mb-4">
          404
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-4">
          Página não encontrada
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Ops! A página que você está procurando não existe ou foi removida.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="bg-primary hover:bg-primary/90"
          >
            <Link href="/">Ir para o início</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/dashboard">Meu Dashboard</Link>
          </Button>
        </div>

        <div className="mt-12 text-6xl opacity-50">
          🎁
        </div>
      </div>
    </div>
  );
}
