'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PublicProfileView } from '@/components/profiles/PublicProfileView';
import { usePublicProfile } from '@/hooks/useProfiles';
import { Loader2 } from 'lucide-react';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: profile, isLoading, error } = usePublicProfile(username);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            User not found
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
        <PublicProfileView
          username={profile.username}
          displayName={profile.display_name}
          isAnonymous={profile.is_anonymous}
          commentsEnabled={profile.comments_enabled}
          accountCreatedAt={profile.account_created_at}
          processes={profile.processes}
          stats={profile.stats}
        />
      </main>
      <Footer />
    </div>
  );
}

