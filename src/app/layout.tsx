import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Novro - Queue Management',
  description: 'SaaS platform for managing clinic queues',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
