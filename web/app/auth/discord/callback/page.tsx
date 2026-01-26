'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authApi, setAuthToken } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function DiscordCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams?.get('token');
      const error = searchParams?.get('error');

      if (error) {
        setStatus('error');
        setMessage('Failed to connect Discord account. Please try again.');
        return;
      }

      if (token) {
        try {
          // Store the token
          setAuthToken(token);
          
          // Refresh user data to get updated Discord connection
          const userData = await authApi.getMe();
          
          // Update auth context immediately
          if (userData) {
            window.dispatchEvent(new CustomEvent('auth-token-set', { detail: { user: userData } }));
          }
          
          // Small delay to ensure context updates, then redirect
          setTimeout(() => {
            window.location.href = '/profile';
          }, 100);
        } catch (err) {
          setStatus('error');
          setMessage('Failed to complete Discord connection. Please try again.');
        }
      } else {
        setStatus('error');
        setMessage('No authentication token received.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-cream-50 dark:bg-ink-900 rounded-lg shadow-md border border-ink-200 dark:border-ink-800 p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-cream-50 mb-2">Connecting Discord...</h2>
              <p className="font-body text-ink-600 dark:text-ink-400">Please wait while we connect your Discord account.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-cream-50 mb-2">Success!</h2>
              <p className="font-body text-ink-600 dark:text-ink-400 mb-4">{message}</p>
              <p className="font-body text-sm text-ink-500 dark:text-ink-500">Redirecting to profile...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-cream-50 mb-2">Connection Failed</h2>
              <p className="font-body text-ink-600 dark:text-ink-400 mb-4">{message}</p>
              <button
                onClick={() => router.push('/profile')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Go to Profile
              </button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function DiscordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    }>
      <DiscordCallbackContent />
    </Suspense>
  );
}

