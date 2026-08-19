import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rafaelo Resort HR',
  description: 'Sistemi i Menaxhimit të Burimeve Njerëzore - Rafaelo Resort',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="sq" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
