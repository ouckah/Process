'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { processApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProcessDetail } from '@/components/processes/ProcessDetail';
import { Loader2 } from 'lucide-react';

export default function ProcessDetailPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const processId = parseInt(params.id as string);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [checkingPublic, setCheckingPublic] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Check if process is public and if user owns it
  useEffect(() => {
    const checkProcess = async () => {
      if (isNaN(processId)) {
        setCheckingPublic(false);
        return;
      }

      try {
        // First check if it's public
        const publicProcess = await processApi.getPublicById(processId);
        
        // If authenticated, check if user owns it
        if (isAuthenticated && !authLoading) {
          try {
            // Try to fetch as owner - if this succeeds, user owns it
            await processApi.getDetail(processId);
            // User owns it, show as normal (not public view)
            setIsPublic(false);
            setAccessDenied(false);
          } catch (error) {
            // User doesn't own it, but it's public - redirect to share link
            if (publicProcess.share_id) {
              router.replace(`/share/${publicProcess.share_id}`);
              return;
            }
            // Public but no share_id (shouldn't happen, but handle it)
            setIsPublic(true);
            setAccessDenied(false);
          }
        } else {
          // Not authenticated, but process is public - allow viewing
          setIsPublic(true);
          setAccessDenied(false);
        }
      } catch (error: any) {
        // Process is not public or doesn't exist
        // If authenticated, check if they own it (might be private)
        if (isAuthenticated && !authLoading) {
          try {
            await processApi.getDetail(processId);
            // User owns it, it's just private
            setIsPublic(false);
            setAccessDenied(false);
            setNotFound(false);
          } catch (detailError: any) {
            // Check if it's a 404 (not found) or 403/other (access denied)
            const status = detailError?.response?.status;
            if (status === 404) {
              // Process doesn't exist
              setIsPublic(false);
              setAccessDenied(false);
              setNotFound(true);
            } else {
              // User doesn't own it and it's private - access denied
              setIsPublic(false);
              setAccessDenied(true);
              setNotFound(false);
            }
          }
        } else {
          // Not authenticated and not public
          // Check if process exists by trying public endpoint again with better error handling
          // If getPublicById failed, it could be:
          // 1. Process doesn't exist (404)
          // 2. Process is private (404 from public endpoint)
          // We can't distinguish without auth, so we'll show "not found" for unauthenticated users
          const status = error?.response?.status;
          if (status === 404) {
            setNotFound(true);
          } else {
            // Other error, assume it's private and needs login
            setIsPublic(false);
            setAccessDenied(false);
            setNotFound(false);
          }
        }
      } finally {
        setCheckingPublic(false);
      }
    };

    if (!authLoading) {
      checkProcess();
    }
  }, [processId, isAuthenticated, authLoading, router]);

  // If process is public, allow viewing without auth
  // Otherwise, require authentication
  useEffect(() => {
    if (!checkingPublic && !authLoading && isPublic === false && !isAuthenticated) {
      router.push('/login');
    }
  }, [checkingPublic, authLoading, isPublic, isAuthenticated, router]);

  if (checkingPublic || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // If not public and not authenticated, don't render (will redirect)
  if (isPublic === false && !isAuthenticated) {
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

  // Show not found message if process doesn't exist
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
            <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
              <p className="font-body text-lg font-black uppercase tracking-wider text-white">
                Process Not Found
              </p>
              <p className="font-body text-sm font-bold uppercase tracking-wider text-white mt-4">
                The process you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show access denied message if user doesn't own a private process
  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
            <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
              <p className="font-body text-lg font-black uppercase tracking-wider text-white">
                Access Denied
              </p>
              <p className="font-body text-sm font-bold uppercase tracking-wider text-white mt-4">
                You don't have permission to view this process.
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
        <ProcessDetail processId={processId} isPublic={isPublic === true} />
      </main>
      <Footer />
    </div>
  );
}
