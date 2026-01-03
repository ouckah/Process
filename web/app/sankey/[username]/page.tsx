'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PublicSankeyView } from '@/components/analytics/PublicSankeyView';
import { analyticsApi, type PublicAnalyticsResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error || 'Sankey diagram not found'}
          </div>
          {isOwnPage && (
            <div className="mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                ← Back to Dashboard
              </button>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        <PublicSankeyView
          analytics={analytics}
          isOwnPage={isOwnPage}
        />
      </main>
      <Footer />
    </div>
  );
}

