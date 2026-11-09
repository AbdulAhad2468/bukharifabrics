import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './fabrics.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Bukhari Fabrics — Premium Fabric & Textile Brand', template: '%s | Bukhari Fabrics' },
  description: 'Discover our premium collection of luxurious fabrics, crafted with precision and designed to elevate your style.',
  applicationName: 'Bukhari Fabrics',
  appleWebApp: { capable: true, title: 'Bukhari Fabrics', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icon.png', type: 'image/png', sizes: '512x512' }], apple: '/apple-icon.png' },
  openGraph: { title: 'Bukhari Fabrics', description: 'Premium fabrics for every occasion.', type: 'website', images: ['/images/bukhari-logo.png'] },
  twitter: { card: 'summary_large_image', title: 'Bukhari Fabrics', description: 'Premium fabrics for every occasion.', images: ['/images/bukhari-logo.png'] },
};
export const viewport: Viewport = { themeColor: '#07532f', width: 'device-width', initialScale: 1, maximumScale: 5 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
