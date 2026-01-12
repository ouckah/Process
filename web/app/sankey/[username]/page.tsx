'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PublicSankeyView } from '@/components/analytics/PublicSankeyView';
import { analyticsApi, type PublicAnalyticsResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function PublicSankeyPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PublicAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSankey = async () => {
      try {
        setLoading(true);
        const data = await analyticsApi.getPublicAnalytics(username);
        setAnalytics(data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to load Sankey diagram';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchSankey();
    }
  }, [username]);

  const isOwnPage = user?.username === username;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
            <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
              <p className="font-body text-lg font-black uppercase tracking-wider text-white mb-4">
                {error || 'Sankey diagram not found'}
              </p>
              {isOwnPage && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-cream-50 dark:bg-ink-900 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider text-ink-900 dark:text-cream-50"
                  >
                    ← Back to Dashboard
                  </button>
                </motion.div>
              )}
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
      <main className="flex-grow w-full py-8">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
          <PublicSankeyView
            analytics={analytics}
            isOwnPage={isOwnPage}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
