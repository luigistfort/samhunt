// src/app/layout.tsx
import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'SAMHunt — Government Contracts for Small Business',
    template: '%s | SAMHunt',
  },
  description:
    'Search SAM.gov contract opportunities with a smarter interface built for small businesses. Filter by NAICS, set-aside, location, deadline, and more.',
  keywords: [
    'SAM.gov',
    'government contracts',
    'small business',
    'federal contracting',
    'NAICS',
    'set-aside',
    '8a',
    'HUBZone',
    'SDVOSB',
    'WOSB',
  ],
  openGraph: {
    title: 'SAMHunt — Government Contracts for Small Business',
    description: 'A smarter way to search SAM.gov',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased bg-zinc-950 text-zinc-100 min-h-screen">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
