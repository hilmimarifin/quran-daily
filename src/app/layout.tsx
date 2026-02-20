import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Naskh_Arabic, Amiri, Scheherazade_New } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from '@/lib/react-query';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopNav } from '@/components/layout/TopNav';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
});

const amiriQuran = Amiri({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400'],
});

const scheherazadeNew = Scheherazade_New({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'HancaQu',
  description: 'Teman baca dan catat progres Al-Quran kamu',
  icons: {
    icon: '/logo/logo4.png',
    shortcut: '/logo/logo4.png',
    apple: '/logo/logo4.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoNaskhArabic.variable} ${amiriQuran.variable} ${scheherazadeNew.variable} antialiased bg-background text-foreground`}
      >
        <ReactQueryProvider>
          <TopNav />
          <main className="pb-20 min-h-screen">{children}</main>
          <BottomNav />
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
