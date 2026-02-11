import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Work_Sans,
  Dancing_Script,
  Cormorant_Garamond,
} from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers/providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LUMIÊ - Transforme seus presentes em realizações",
  description: "Crie sua lista de presentes inteligente. Seus convidados escolhem presentes, você recebe em dinheiro para realizar seus sonhos.",
  keywords: "lista de presentes, casamento, chá de casa nova, presente em dinheiro, lista online",
  authors: [{ name: "LUMIÊ" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "LUMIÊ",
    title: "LUMIÊ - Transforme seus presentes em realizações",
    description: "Crie sua lista de presentes inteligente. Seus convidados escolhem presentes, você recebe em dinheiro para realizar seus sonhos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LUMIÊ - Transforme seus presentes em realizações",
    description: "Crie sua lista de presentes inteligente.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@300;400;500;600;700&family=Libre+Baskerville:wght@400;700&family=Merriweather:wght@300;400;700;900&family=Lora:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700&family=Crimson+Text:wght@400;600;700&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&family=Lato:wght@300;400;700;900&family=Open+Sans:wght@300;400;600;700;800&family=Roboto:wght@300;400;500;700;900&family=Poppins:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800&family=Nunito:wght@300;400;600;700;800&family=Work+Sans:wght@300;400;500;600;700;800&family=Raleway:wght@300;400;500;600;700;800&family=Source+Sans+3:wght@300;400;600;700;800&display=swap"
        />
      </head>

      <body
        className={`
          ${inter.variable}
          ${playfair.variable}
          ${workSans.variable}
          ${dancing.variable}
          ${cormorant.variable}
          font-sans antialiased
        `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
