import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ReactQueryProvider } from './providers';

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

// Get the base URL for metadata
const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL || 
  process.env.NEXT_PUBLIC_FRONTEND_URL || 
  'http://localhost:3000'
);

export const metadata: Metadata = {
  metadataBase,
  title: 'Process',
  description: 'Track your job application processes and stages',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="font-body bg-cream-50 dark:bg-ink-950 text-ink-900 dark:text-cream-50 antialiased">
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

