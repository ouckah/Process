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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (!isAuthenticated || !adminData?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Feedback Management</h1>
          <p className="text-gray-600 dark:text-gray-400">View all submitted feedback from users.</p>
        </div>

        {!feedback || feedback.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {item.user_id ? (
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.username || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.user_email}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.email}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

