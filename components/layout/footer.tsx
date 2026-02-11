import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-[#2B2422] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <div className="relative w-24 h-12 mb-4 brightness-0 invert">
              <Image
                src="/logo.png"
                alt="LUMIÊ"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm max-w-sm">
              Transforme seus presentes em sonhos realizados. 
              A forma mais elegante de celebrar momentos especiais.
            </p>
          </div>
          
          <div>
            <h4 className="font-display text-lg mb-4">Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/como-funciona" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/tarifas" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Tarifas
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-lg mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/termos" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/lgpd" className="text-sm text-gray-400 hover:text-white transition-colors">
                  LGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            © 2024 LUMIÊ. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
