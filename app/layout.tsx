import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Newsreader } from 'next/font/google';
import { site } from '@/content';
import './globals.css';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  title: site.name,
  description: site.subtitle,
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
