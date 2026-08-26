import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import LocaleBoot from '@/components/LocaleBoot';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Forkiva',
  description: 'Forkiva Restaurant POS — Next.js + Node replica',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <LocaleBoot />
        {children}
      </body>
    </html>
  );
}
