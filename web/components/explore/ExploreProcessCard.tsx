'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import type { ExploreProcess } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface ExploreProcessCardProps {
  process: ExploreProcess;
  index: number;
}

export function ExploreProcessCard({ process, index }: ExploreProcessCardProps) {
  const shareUrl = process.share_id ? `/share/${process.share_id}` : null;
  
  // Status color mapping
  const statusColors = {
    active: 'bg-blue-600 dark:bg-blue-500',
    completed: 'bg-green-600 dark:bg-green-500',
    rejected: 'bg-red-600 dark:bg-red-500',
  };

  const rotation = index % 2 === 0 ? '-rotate-1' : 'rotate-1';
  
  // Get user display info
  const userDisplayName = process.user_is_anonymous 
    ? (process.user_display_name || 'Anonymous')
    : (process.user_display_name || process.user_username || 'Unknown');
  
  const userProfileUrl = process.user_username ? `/profile/${process.user_username}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
      <div className={`relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform ${rotation} group-hover:rotate-0 transition-transform`}>
        {/* Header with status and user */}
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-block ${statusColors[process.status as keyof typeof statusColors]} px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1`}>
            <span className="font-body text-xs uppercase tracking-wider font-black text-white">
              {process.status}
            </span>
          </div>
          
          {userProfileUrl && (
            <Link href={userProfileUrl} className="flex items-center gap-2 group/user">
              <Avatar
                discordAvatar={process.user_discord_avatar}
                discordId={process.user_discord_id}
                username={process.user_username || userDisplayName || 'Anonymous'}
                size="sm"
              />
              <span className="font-body text-xs font-bold text-ink-700 dark:text-ink-300 group-hover/user:underline">
                {userDisplayName}
              </span>
            </Link>
          )}
        </div>

        {/* Company Name */}
        <div className="mb-4">
          <h3 className="font-display text-2xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight mb-2">
            {process.company_name}
          </h3>
          {process.position && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-ink-600 dark:text-ink-400" />
              <p className="font-body text-ink-700 dark:text-ink-300 font-bold">{process.position}</p>
            </div>
          )}
        </div>

        {/* Stages */}
        {process.stages && process.stages.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-2">
              <span className="font-body text-xs uppercase tracking-wider font-black text-cream-50 dark:text-ink-900">
                {process.stages.length} {process.stages.length === 1 ? 'Stage' : 'Stages'}
              </span>
            </div>
            <div className="space-y-1">
              {process.stages.slice(0, 3).map((stage, idx) => (
                <div key={stage.id} className="flex items-center gap-2 text-sm">
                  <Calendar className="w-3 h-3 text-ink-600 dark:text-ink-400 flex-shrink-0" />
                  <span className="font-body font-bold text-ink-800 dark:text-ink-200">
                    {stage.stage_name}
                  </span>
                  <span className="font-body text-xs text-ink-600 dark:text-ink-400">
                    {format(new Date(stage.stage_date), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
              {process.stages.length > 3 && (
                <p className="font-body text-xs text-ink-600 dark:text-ink-400 font-bold">
                  +{process.stages.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer with link */}
        {shareUrl && (
          <div className="mt-6 pt-4 border-t-4 border-ink-900 dark:border-cream-50">
            <Link href={shareUrl}>
              <div className="bg-indigo-600 dark:bg-indigo-500 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block group/link">
                <span className="font-body text-sm uppercase tracking-wider font-black text-white group-hover/link:underline">
                  View Details
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
