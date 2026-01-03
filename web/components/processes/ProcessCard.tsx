'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Calendar, Layers, CheckSquare, Square } from 'lucide-react';
import { useProcessDetail } from '@/hooks/useProcesses';
import type { Process } from '@/types';

interface ProcessCardProps {
  process: Process;
  onDelete?: (id: number) => void;
  showActions?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function ProcessCard({ 
  process, 
  onDelete, 
  showActions = true,
  selectionMode = false,
  isSelected = false,
  onToggleSelection
}: ProcessCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  
  // Fetch process detail for stage information (lazy load)
  const { data: processDetail } = useProcessDetail(process.id);
  
  const stages = processDetail?.stages || [];
  const stageCount = stages.length;
  
  // Get last stage date
  const lastStageDate = stages.length > 0
    ? stages.reduce((latest, stage) => {
        const stageDate = new Date(stage.stage_date);
        const latestDate = new Date(latest.stage_date);
        return stageDate > latestDate ? stage : latest;
      }, stages[0])
    : null;


  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or in selection mode
    if ((e.target as HTMLElement).closest('button, a') || selectionMode) {
      if (selectionMode && onToggleSelection && !(e.target as HTMLElement).closest('button, a')) {
        onToggleSelection();
      }
      return;
    }
    router.push(`/processes/${process.id}`);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 px-6 pt-4 pb-6 hover:shadow-lg transition-all group ${
        selectionMode ? 'cursor-default' : 'cursor-pointer'
      } ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        {selectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection?.();
            }}
            className="mr-3 mt-1"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            )}
          </button>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-2">
            <StatusBadge status={process.status} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate mb-2">
            {process.company_name}
          </h3>
          {/* Position - always reserve space to keep alignment consistent */}
          <div className="mb-3 min-h-[1.5rem]">
            {process.position && (
              <p className="text-gray-600 dark:text-gray-400 truncate">{process.position}</p>
            )}
          </div>

          {/* Stage Count and Last Stage Date - always reserve space */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3 min-h-[1.5rem]">
            {stageCount > 0 && (
              <div className="flex items-center gap-1" title={`${stageCount} stage${stageCount !== 1 ? 's' : ''}`}>
                <Layers className="w-4 h-4" />
                <span>{stageCount} stage{stageCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {lastStageDate && (
              <div className="flex items-center gap-1" title={`Last stage: ${formatDate(lastStageDate.stage_date)}`}>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(lastStageDate.stage_date)}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      {showActions && (
        <div className="mt-4 flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href={`/processes/${process.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" title="Edit">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(process.id);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Hover Tooltip */}
      {isHovered && (
        <div className="absolute z-10 px-3 py-2 mt-2 text-sm text-white dark:text-gray-100 bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="font-semibold mb-1">{process.company_name}</div>
          {process.position && <div className="text-gray-300 dark:text-gray-300">{process.position}</div>}
          <div className="text-gray-400 dark:text-gray-400 mt-1">
            Status: {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
          </div>
          {stageCount > 0 && (
            <div className="text-gray-400 dark:text-gray-400">Stages: {stageCount}</div>
          )}
        </div>
      )}
    </div>
  );
}

