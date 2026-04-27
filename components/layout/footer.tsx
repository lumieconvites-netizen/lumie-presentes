import Link from 'next/link';
import Image from 'next/image';
import { Instagram, MessageCircle } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-[#2b2422] via-[#2f2623] to-[#2b2422] text-white py-10 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="relative w-20 h-10 mb-3">
              <Image src="/logo.png" alt="LUMIE" fill className="object-contain brightness-0 invert" />
            </div>
            <p className="text-[#d8cfc9] text-sm leading-relaxed max-w-xs">Anunciando sonhos.</p>
          </div>

          <div>
            <h4 className="font-display text-xl mb-3 text-[#f1e5dc]">Navegação</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/templates" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  Temas
                </Link>
              </li>
              <li>
                <Link href="/tarifas" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  Loja
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  Álbum de fotos
                </Link>
              </li>
              <li>
                <Link href="/dashboard/rsvp" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  Formulário RSVP
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xl mb-3 text-[#f1e5dc]">Informações</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  Lumie Eventos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/seja-parceiro" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link href="/lgpd" className="text-sm text-[#d8cfc9] hover:text-white transition-colors">
                  LGPD
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xl mb-3 text-[#f1e5dc]">Contato</h4>
            <div className="flex items-center gap-2 mb-3">
              <a
                href="https://instagram.com/lumie.convites"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#fdcf5c] via-[#f77737] to-[#c13584] text-white shadow-sm hover:brightness-110 transition"
                aria-label="Instagram da Lumie"
              >
                <Instagram className="w-[15px] h-[15px]" />
              </a>
              <a
                href="https://wa.me/5516981873064"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25d366] text-white shadow-sm hover:brightness-110 transition"
                aria-label="WhatsApp da Lumie"
              >
                <MessageCircle className="w-[15px] h-[15px]" />
              </a>
            </div>
            <div className="space-y-1 text-sm text-[#d8cfc9]">
              <p>CNPJ: 62.076.127/0001-41</p>
              <p>Lumie Convites LTDA</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-[#4a3f3a] text-center">
          <p className="text-xs text-[#b7aaa2]">Feito com ❤️ por Lumie Convites · {currentYear}</p>
        </div>
      </div>
    </footer>
  );
}

export function CompactFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e9d9cd] bg-[#fffaf6]">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col items-center text-center gap-2">
        <div className="relative w-16 h-8">
          <Image src="/logo.png" alt="LUMIE" fill className="object-contain" />
        </div>
        <p className="text-sm text-[#6b5a52]">Transforme seus presentes em sonhos realizados.</p>
        <p className="text-xs text-[#8a786f]">© {currentYear} LUMIE. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
