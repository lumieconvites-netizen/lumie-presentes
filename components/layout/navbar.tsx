import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  currentPage?: string;
}

export function Navbar({ currentPage }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="relative w-16 h-8">
              <Image
                src="/logo.png"
                alt="LUMIÊ"
                fill
                className="object-contain"
              />
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm text-foreground">
              <Link 
                href="/" 
                className={`hover:text-primary transition-colors ${
                  currentPage === 'home' ? 'text-primary font-medium' : ''
                }`}
              >
                Início
              </Link>
              <Link 
                href="/como-funciona" 
                className={`hover:text-primary transition-colors ${
                  currentPage === 'como-funciona' ? 'text-primary font-medium' : ''
                }`}
              >
                Como Funciona
              </Link>
              <Link 
                href="/tarifas" 
                className={`hover:text-primary transition-colors ${
                  currentPage === 'tarifas' ? 'text-primary font-medium' : ''
                }`}
              >
                Tarifas
              </Link>
              <Link 
                href="/templates" 
                className={`hover:text-primary transition-colors ${
                  currentPage === 'templates' ? 'text-primary font-medium' : ''
                }`}
              >
                Templates
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-foreground">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full">
              <Link href="/cadastro">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
