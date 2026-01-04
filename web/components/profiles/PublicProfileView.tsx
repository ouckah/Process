'use client';

import React from 'react';
import { PublicProcessCard } from './PublicProcessCard';
import { ProfileStats } from './ProfileStats';
import { ProfileComments } from './ProfileComments';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader2 } from 'lucide-react';
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
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  // Determine display name: show username by default, or display_name/Anonymous User if anonymous
  const profileDisplayName = isAnonymous
    ? (displayName || 'Anonymous User')
    : username;

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <div className="flex items-center space-x-4">
          <Avatar
            discordAvatar={discordAvatar}
            discordId={discordId}
            username={username}
            size="xl"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {profileDisplayName}
              </h1>
              {isAnonymous && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                  Anonymous
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Member since {formatDate(accountCreatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats.total_public_processes > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistics</h2>
          <ProfileStats stats={stats} />
        </div>
      )}

      {/* Public Processes */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Public Processes ({processes.length})
        </h2>
        {processes.length === 0 ? (
          <EmptyState
            type="no-processes"
            title="No Public Processes"
            description="This user hasn't made any processes public yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processes.map((process) => (
              <PublicProcessCard key={process.id} process={process} />
            ))}
          </div>
        )}
      </div>

      {/* Comments & Questions */}
      <div>
        <ProfileComments
          username={username}
          commentsEnabled={commentsEnabled}
          isProfileOwner={isProfileOwner}
        />
      </div>
    </div>
  );
}

