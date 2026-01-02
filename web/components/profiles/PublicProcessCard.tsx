'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Process } from '@/types';

interface PublicProcessCardProps {
  process: Process;
}

export function PublicProcessCard({ process }: PublicProcessCardProps) {
  const shareUrl = process.share_id ? `/share/${process.share_id}` : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
            {process.company_name}
          </h3>
          {process.position && (
            <p className="text-gray-600 dark:text-gray-400 mt-1 truncate">{process.position}</p>
          )}
        </div>
        <StatusBadge status={process.status} />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Updated {formatDate(process.updated_at)}
        </div>
        {shareUrl && (
          <Link href={shareUrl}>
            <span className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View Details →
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

