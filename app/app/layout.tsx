'use client';

import { Montserrat, Outfit, JetBrains_Mono } from "next/font/google";
import { usePathname } from 'next/navigation';
import ClientProviders from "@/providers/ClientProviders";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <title>Circuit</title>
        <link rel="icon" href="/logo/logo_icon_white.svg" type="image/svg+xml" />
        <meta name="description" content="Made-to-order fashion on Solana blockchain" />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white font-body antialiased overflow-x-hidden">
        <ClientProviders>
          {!isAdminPage && <Navbar />}
          <main className={`flex-1 ${!isAdminPage ? 'pt-[72px]' : ''}`} role="main">
            {children}
          </main>
          {!isAdminPage && <Footer />}
          <Toast />
        </ClientProviders>
      </body>
    </html>
  );
}
