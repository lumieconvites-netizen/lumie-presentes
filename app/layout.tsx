import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Lato,
  Open_Sans,
  Roboto,
  Nunito,
  Raleway,
  Poppins,
  Montserrat,
  Great_Vibes,
  Allura,
  Playfair_Display,
  Work_Sans,
  Dancing_Script,
  Cormorant_Garamond,
} from 'next/font/google';

import './globals.css';
import { Providers } from '@/components/providers/providers';
import { FooterGate } from '@/components/layout/footer-gate';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

const dancing = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
  weight: ['400', '700'],
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
  weight: ['400', '500', '700'],
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  variable: '--font-great-vibes',
  display: 'swap',
  weight: ['400'],
});

const allura = Allura({
  subsets: ['latin'],
  variable: '--font-allura',
  display: 'swap',
  weight: ['400'],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'LUMIÊ - Transforme seus presentes em realizações',
  description:
    'Crie sua lista de presentes inteligente. Seus convidados escolhem presentes, você recebe em dinheiro para realizar seus sonhos.',
  keywords:
    'lista de presentes, casamento, chá de casa nova, presente em dinheiro, lista online',
  authors: [{ name: 'LUMIÊ' }],

  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: new URL(appUrl),
    siteName: 'LUMIÊ',
    title: 'LUMIÊ - Transforme seus presentes em realizações',
    description:
      'Crie sua lista de presentes inteligente. Seus convidados escolhem presentes, você recebe em dinheiro para realizar seus sonhos.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LUMIÊ - Transforme seus presentes em realizações',
    description: 'Crie sua lista de presentes inteligente.',
  },

  icons: {
    icon: '/favicon-lumie.png',
    shortcut: '/favicon-lumie.png',
    apple: '/favicon-lumie.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`
          ${inter.variable}
          ${playfair.variable}
          ${workSans.variable}
          ${dancing.variable}
          ${cormorant.variable}
          ${lato.variable}
          ${openSans.variable}
          ${roboto.variable}
          ${nunito.variable}
          ${raleway.variable}
          ${poppins.variable}
          ${montserrat.variable}
          ${greatVibes.variable}
          ${allura.variable}
          font-sans antialiased overflow-x-hidden
        `}
      >
        <div className="min-h-screen flex flex-col overflow-x-hidden">
          <main className="flex-1 overflow-x-hidden">
            <Providers>{children}</Providers>
          </main>
          <FooterGate />
        </div>
      </body>
    </html>
  );
}


