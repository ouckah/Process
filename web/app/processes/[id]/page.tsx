'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProcessDetail } from '@/components/processes/ProcessDetail';
import { Loader2 } from 'lucide-react';

export default function ProcessDetailPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const processId = parseInt(params.id as string);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isNaN(processId)) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
            <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
              <p className="font-body text-lg font-black uppercase tracking-wider text-white">
                Invalid process ID
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProcessDetail processId={processId} />
      </main>
      <Footer />
    </div>
  );
}
