'use client';

import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { Process } from '@/types';

interface PublicProcessCardProps {
  process: Process;
}

export function PublicProcessCard({ process }: PublicProcessCardProps) {
  const shareUrl = process.share_id ? `/share/${process.share_id}` : null;

  // Status color mapping
  const statusColors = {
    active: 'bg-blue-600 dark:bg-blue-500',
    completed: 'bg-green-600 dark:bg-green-500',
    rejected: 'bg-red-600 dark:bg-red-500',
  };

  const rotation = Math.random() > 0.5 ? '-rotate-1' : 'rotate-1';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
      <div className={`relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform ${rotation} group-hover:rotate-0 transition-transform`}>
        {/* Status Badge - Brutalist */}
        <div className="mb-4">
          <div className={`inline-block ${statusColors[process.status]} px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1`}>
            <span className="font-body text-xs uppercase tracking-wider font-black text-white">
              {process.status}
            </span>
          </div>
        </div>

        {/* Company Name */}
        <div className="mb-3">
          <h3 className="font-display text-2xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight truncate mb-2">
            {process.company_name}
          </h3>
          {process.position && (
            <p className="font-body text-ink-700 dark:text-ink-300 font-bold truncate">{process.position}</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t-4 border-ink-900 dark:border-cream-50">
          <div className="font-body text-sm text-ink-600 dark:text-ink-400 font-bold mb-3 uppercase tracking-wider">
            Updated {formatDate(process.updated_at)}
          </div>
          {shareUrl && (
            <Link href={shareUrl}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <div className="bg-indigo-600 dark:bg-indigo-500 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 hover:rotate-0 transition-transform">
                  <span className="font-body text-sm font-black uppercase tracking-wider text-white">
                    View Details →
                  </span>
                </div>
              </motion.div>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
