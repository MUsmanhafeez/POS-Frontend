import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import LocaleBoot from '@/components/LocaleBoot';
import ThemeBoot from '@/components/ThemeBoot';
import AppBoot from '@/components/AppBoot';
import PwaBoot from '@/components/PwaBoot';
import OfflineBoot from '@/components/OfflineBoot';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Forkiva',
  description: 'Forkiva Restaurant POS — Next.js + Node replica',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeBoot />
        <AppBoot />
        <LocaleBoot />
        <PwaBoot />
        <OfflineBoot />
        {children}
      </body>
    </html>
  );
}
