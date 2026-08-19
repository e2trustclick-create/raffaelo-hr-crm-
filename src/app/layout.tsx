import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rafaelo Resort HR',
  description: 'Sistemi i Menaxhimit të Burimeve Njerëzore - Rafaelo Resort',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rafaelo HR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#861823',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="sq" className="h-full antialiased">
      <body className="min-h-full overscroll-none">{children}</body>
    </html>
  );
}
