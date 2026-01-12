'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authApi, setAuthToken } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function GoogleCallbackContent() {
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
        setMessage('Failed to connect Google account. Please try again.');
        return;
      }

      if (token) {
        try {
          // Store the token
          setAuthToken(token);
          
          // Refresh user data to get updated Google connection
          await authApi.getMe();
          
          // Redirect to dashboard - full page reload will refresh auth context
          window.location.href = '/dashboard';
        } catch (err) {
          setStatus('error');
          setMessage('Failed to complete Google connection. Please try again.');
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
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
              <p className="font-body text-ink-600 dark:text-ink-400">Connecting your Google account...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto" />
              <p className="font-body text-ink-600 dark:text-ink-400">Successfully connected! Redirecting...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
              <p className="font-body text-red-600 dark:text-red-400">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="mt-4 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}

