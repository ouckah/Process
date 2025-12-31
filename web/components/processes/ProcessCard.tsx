'use client';

import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';
import type { Process } from '@/types';

interface ProcessCardProps {
  process: Process;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function ProcessCard({ process, onDelete, showActions = true }: ProcessCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{process.company_name}</h3>
            <StatusBadge status={process.status} />
          </div>
          {process.position && (
            <p className="text-gray-600 mb-3">{process.position}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Created: {formatDate(process.created_at)}</span>
            {process.updated_at !== process.created_at && (
              <span>Updated: {formatDate(process.updated_at)}</span>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="mt-4 flex items-center space-x-2 pt-4 border-t border-gray-200">
          <Link href={`/processes/${process.id}`}>
            <Button variant="outline" size="sm" title="Edit">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(process.id)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

