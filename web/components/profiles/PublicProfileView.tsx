'use client';

import React from 'react';
import { PublicProcessCard } from './PublicProcessCard';
import { ProfileStats } from './ProfileStats';
import { ProfileComments } from './ProfileComments';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Process } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface PublicProfileViewProps {
  username: string;
  displayName?: string | null;
  discordAvatar?: string | null;
  discordId?: string | null;
  isAnonymous?: boolean;
  commentsEnabled?: boolean;
  accountCreatedAt: string;
  processes: Process[];
  stats: {
    total_public_processes: number;
    offers_received: number;
    active_applications: number;
    rejected: number;
    success_rate: number;
    comment_count?: number;
  };
  isLoading?: boolean;
}

export function PublicProfileView({
  username,
  displayName,
  discordAvatar,
  discordId,
  isAnonymous = false,
  commentsEnabled = true,
  accountCreatedAt,
  processes,
  stats,
  isLoading = false,
}: PublicProfileViewProps) {
  const { user } = useAuth();
  const isProfileOwner = user?.username === username;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // Determine display name: show username by default, or display_name/Anonymous User if anonymous
  const profileDisplayName = isAnonymous
    ? (displayName || 'Anonymous User')
    : username;

  return (
    <div className="space-y-12">
      {/* User Header - Brutalist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform -rotate-1 group-hover:rotate-0 transition-transform">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-2 translate-y-2"></div>
              <div className="relative">
                <Avatar
                  discordAvatar={discordAvatar}
                  discordId={discordId}
                  username={username}
                  size="xl"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <h1 className="font-display text-4xl sm:text-5xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight">
                  {profileDisplayName}
                </h1>
                {isAnonymous && (
                  <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                    <span className="font-body text-xs uppercase tracking-widest font-black text-cream-50 dark:text-ink-900">
                      Anonymous
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-indigo-600 dark:bg-indigo-500 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
                <p className="font-body text-sm font-black uppercase tracking-wider text-white">
                  Member since {formatDate(accountCreatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats - Brutalist */}
      {stats.total_public_processes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-6">
            <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 mb-4">
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Statistics
              </h2>
            </div>
          </div>
          <ProfileStats stats={stats} />
        </motion.div>
      )}

      {/* Public Processes - Brutalist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="mb-6">
          <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-4">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
              Public Processes ({processes.length})
            </h2>
          </div>
        </div>
        {processes.length === 0 ? (
          <EmptyState
            type="no-processes"
            title="No Public Processes"
            description="This user hasn't made any processes public yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processes.map((process, idx) => (
              <motion.div
                key={process.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
              >
                <PublicProcessCard process={process} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Comments & Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <ProfileComments
          username={username}
          commentsEnabled={commentsEnabled}
          isProfileOwner={isProfileOwner}
        />
      </motion.div>
    </div>
  );
}
