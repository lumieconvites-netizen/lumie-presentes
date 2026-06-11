'use client';

import { useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';

const WHATSAPP_NUMBER = '5516981873064';

const supportOptions = [
  'Criei minha conta, gostaria de solicitar a construção do site.',
  'Estou com dúvidas em relação ao editor de páginas.',
  'Estou com dúvidas em relação aos presentes.',
];

function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function PremiumWhatsappSupport() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(calc(100vw-2.5rem),360px)] rounded-2xl border border-[#ead9cd] bg-white p-4 shadow-[0_18px_50px_rgba(50,35,29,0.18)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#2f2622]">Como podemos ajudar?</p>
              <p className="mt-1 text-xs text-[#7a665d]">Escolha uma opção para abrir o WhatsApp.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ead9cd] text-[#6d564b] hover:bg-[#fff7f2]"
              aria-label="Fechar atendimento"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {supportOptions.map((message) => (
              <a
                key={message}
                href={buildWhatsAppUrl(message)}
                target="_blank"
                rel="noreferrer"
                className="flex rounded-xl border border-[#ead9cd] bg-[#fffaf6] px-4 py-3 text-sm font-medium leading-snug text-[#4a3a33] transition hover:border-[#c65a3a] hover:bg-[#fff1e8] hover:text-[#8e3d2c]"
              >
                {message}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3 rounded-full border border-[#cfeedd] bg-white/95 py-2 pl-4 pr-2 shadow-[0_12px_30px_rgba(31,168,85,0.16)] backdrop-blur-sm">
        <span className="text-sm font-semibold text-[#23613d]">Dúvida? Fale conosco!</span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-[#1fa855] text-white shadow-[0_12px_30px_rgba(31,168,85,0.28)] transition hover:bg-[#178d47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1fa855] focus-visible:ring-offset-2"
          aria-expanded={open}
          aria-label="Abrir atendimento pelo WhatsApp"
          title="Atendimento pelo WhatsApp"
        >
          <MessageCircle className="h-7 w-7" strokeWidth={1.8} />
          <Phone className="absolute h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
