import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Astro Shine - Admin Panel',
  description: 'Admin management panel for Astro Shine platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
