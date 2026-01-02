'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { processApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StageTimeline } from '@/components/stages/StageTimeline';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ProcessDetail } from '@/types';

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcess = async () => {
      try {
        setLoading(true);
        const data = await processApi.getPublic(shareId);
        setProcess(data);
      } catch (err: any) {
        const errorDetail = err.response?.data?.detail;
        if (Array.isArray(errorDetail)) {
          setError(errorDetail.map((e: any) => e.msg || JSON.stringify(e)).join(', ') || 'Process not found or not publicly shared');
        } else if (typeof errorDetail === 'string') {
          setError(errorDetail);
        } else {
          setError('Process not found or not publicly shared');
        }
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchProcess();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error || 'Process not found'}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{process.company_name}</h1>
            <StatusBadge status={process.status} />
          </div>
          {process.position && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{process.position}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Created: {formatDate(process.created_at)}</span>
            {process.updated_at !== process.created_at && (
              <span>Updated: {formatDate(process.updated_at)}</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Process Timeline</h3>
          <StageTimeline stages={process.stages} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

