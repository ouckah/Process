import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ReactQueryProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" className="bg-white">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

