import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'OpsPilot — Enterprise Operations Intelligence', description: 'AI-powered operations platform for maintenance, inventory, HR and analytics.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
