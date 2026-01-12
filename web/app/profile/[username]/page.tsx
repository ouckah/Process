'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PublicProfileView } from '@/components/profiles/PublicProfileView';
import { usePublicProfile } from '@/hooks/useProfiles';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: profile, isLoading, error } = usePublicProfile(username);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
            <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
              <p className="font-body text-lg font-black uppercase tracking-wider text-white">User not found</p>
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
        <PublicProfileView
          username={profile.username}
          displayName={profile.display_name}
          discordAvatar={profile.discord_avatar}
          discordId={profile.discord_id}
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
