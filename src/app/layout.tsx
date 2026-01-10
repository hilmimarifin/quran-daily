import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from '@/lib/react-query';
import { BottomNav } from '@/components/layout/BottomNav';

import { TopNav } from '@/components/layout/TopNav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Quran Reader',
  description: 'Track your Quran reading progress',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ReactQueryProvider>
          <TopNav />
          <main className="pb-20 min-h-screen">{children}</main>
          <BottomNav />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
