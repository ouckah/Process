'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { processApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StageTimeline } from '@/components/stages/StageTimeline';
import { formatDate } from '@/lib/utils';
import { Loader2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
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
        console.log('Fetched process data:', data); // Debug log
        
        // If username is missing, try to fetch it from explore endpoint
        if (!data.username && data.id) {
          try {
            const { exploreApi } = await import('@/lib/api');
            const exploreProcessesResponse = await exploreApi.getProcesses({ 
              search: data.company_name,
              limit: 100 
            });
            const matchingProcess = exploreProcessesResponse.processes.find((p: any) => p.share_id === shareId);
            if (matchingProcess?.user_username) {
              data.username = matchingProcess.user_username;
            }
          } catch (exploreErr) {
            console.warn('Could not fetch username from explore endpoint:', exploreErr);
          }
        }
        
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

  // Status color mapping
  const statusColors = {
    active: 'bg-blue-600 dark:bg-blue-500',
    completed: 'bg-green-600 dark:bg-green-500',
    rejected: 'bg-red-600 dark:bg-red-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
            <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
              <p className="font-body text-lg font-black uppercase tracking-wider text-white">
                {error || 'Process not found'}
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
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Process Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group mb-8"
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink-900 dark:text-cream-50 mb-3">
                  {process.company_name}
                </h1>
                {process.position && (
                  <p className="font-body text-xl text-ink-700 dark:text-ink-300 font-bold mb-4">
                    {process.position}
                  </p>
                )}
                {process.description && (
                  <div className="relative group mb-4">
                    <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                    <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
                      <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-3">
                        <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                          Process Description
                        </p>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none font-body text-ink-900 dark:text-cream-50 whitespace-pre-wrap">
                        {process.description}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className={`inline-block ${statusColors[process.status]} px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1`}>
                    <span className="font-body text-xs uppercase tracking-wider font-black text-white">
                      {process.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-body text-ink-600 dark:text-ink-400">
                      Created: {formatDate(process.created_at)}
                    </span>
                    {process.updated_at !== process.created_at && (
                      <span className="font-body text-ink-600 dark:text-ink-400">
                        Updated: {formatDate(process.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Process Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="inline-block bg-ink-900 dark:bg-cream-50 px-6 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1">
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Process Timeline
              </h3>
            </div>
            {process.username && (
              <Link href={`/profile/${process.username}?ask=true&question=${encodeURIComponent(`Can you tell me more about your experience with ${process.company_name}${process.position ? ` for the ${process.position} position` : ''}?`)}`}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask About Process
                  </Button>
                </motion.div>
              </Link>
            )}
          </div>
          <StageTimeline stages={process.stages} />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

