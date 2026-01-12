'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useFeedback } from '@/hooks/useFeedback';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AdminFeedbackPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { data: adminData, isLoading: adminLoading } = useAdmin();
  const { data: feedback, isLoading: feedbackLoading } = useFeedback();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!adminLoading && adminData && !adminData.is_admin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, adminLoading, adminData, router]);

  if (authLoading || adminLoading || feedbackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <div className="relative">
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform rotate-1">
            <Loader2 className="w-8 h-8 animate-spin text-ink-900 dark:text-cream-50" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !adminData?.is_admin) {
    return null;
  }

  const rotation = (index: number) => {
    return index % 2 === 0 ? 'rotate-1' : '-rotate-1';
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="inline-block bg-ink-900 dark:bg-cream-50 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 mb-4">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
              Feedback Management
            </h1>
          </div>
          <div className="bg-cream-100 dark:bg-ink-800 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
            <p className="font-body text-sm font-black text-ink-900 dark:text-cream-50">
              View all submitted feedback from users
            </p>
          </div>
        </motion.div>

        {!feedback || feedback.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
            <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform -rotate-1">
              <p className="font-body text-center font-black text-ink-900 dark:text-cream-50 uppercase tracking-wider">
                No feedback submitted yet
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {feedback.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
                <div className={`relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform ${rotation(index)}`}>
                  {/* Header with user info and date */}
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      {item.user_id ? (
                        <div className="space-y-2">
                          <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
                            <p className="font-display text-lg font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                              {item.username || 'User'}
                            </p>
                          </div>
                          <div className="bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
                            <p className="font-body text-xs font-black uppercase tracking-wider text-white">
                              {item.user_email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
                            <p className="font-display text-lg font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                              {item.name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
                            <p className="font-body text-xs font-black uppercase tracking-wider text-white">
                              {item.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 flex-shrink-0">
                      <p className="font-body text-xs font-black uppercase tracking-wider text-white whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-4 pt-4 border-t-4 border-ink-900 dark:border-cream-50">
                    <p className="font-body text-ink-900 dark:text-cream-50 whitespace-pre-wrap font-bold leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

