'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Calendar, Layers, CheckSquare, Square } from 'lucide-react';
import { useProcessDetail } from '@/hooks/useProcesses';
import { motion } from 'framer-motion';
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
      <div className={`absolute inset-0 ${isSelected ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-ink-900 dark:bg-cream-50'} translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform`}></div>
      <div
        className={`relative bg-cream-50 dark:bg-ink-900 border-4 ${isSelected ? 'border-indigo-600 dark:border-indigo-500' : 'border-ink-900 dark:border-cream-50'} p-6 transform ${rotation} group-hover:rotate-0 transition-all ${
          selectionMode ? 'cursor-default' : 'cursor-pointer'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-4">
          {selectionMode && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection?.();
              }}
              className="mr-3 mt-1"
            >
              {isSelected ? (
                <div className="w-6 h-6 bg-indigo-600 dark:bg-indigo-500 border-2 border-ink-900 dark:border-cream-50 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 border-2 border-ink-900 dark:border-cream-50"></div>
              )}
            </motion.button>
          )}
          
          <div className="flex-1 min-w-0">
            {/* Status Badge - Brutalist */}
            <div className="mb-3">
              <div className={`inline-block ${statusColors[process.status]} px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1`}>
                <span className="font-body text-xs uppercase tracking-wider font-black text-white">
                  {process.status}
                </span>
              </div>
            </div>

            {/* Company Name */}
            <h3 className="font-display text-2xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight mb-2 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {process.company_name}
            </h3>

            {/* Position */}
            <div className="mb-4 min-h-[1.5rem]">
              {process.position && (
                <p className="font-body text-ink-700 dark:text-ink-300 font-bold truncate">{process.position}</p>
              )}
            </div>

            {/* Stage Count and Last Stage Date */}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-4 min-h-[1.5rem]">
              {stageCount > 0 && (
                <div className="flex items-center gap-2" title={`${stageCount} stage${stageCount !== 1 ? 's' : ''}`}>
                  <div className="bg-ink-900 dark:bg-cream-50 w-5 h-5 border border-ink-900 dark:border-cream-50 flex items-center justify-center">
                    <Layers className="w-3 h-3 text-cream-50 dark:text-ink-900" />
                  </div>
                  <span className="font-body text-ink-700 dark:text-ink-300 font-bold">{stageCount} stage{stageCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {lastStageDate && (
                <div className="flex items-center gap-2" title={`Last stage: ${formatDate(lastStageDate.stage_date)}`}>
                  <div className="bg-ink-900 dark:bg-cream-50 w-5 h-5 border border-ink-900 dark:border-cream-50 flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-cream-50 dark:text-ink-900" />
                  </div>
                  <span className="font-body text-ink-700 dark:text-ink-300 font-bold">{formatDate(lastStageDate.stage_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Brutalist */}
        {showActions && (
          <div className="mt-6 pt-4 border-t-4 border-ink-900 dark:border-cream-50 flex items-center space-x-3">
            <Link href={`/processes/${process.id}`} onClick={(e) => e.stopPropagation()}>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  title="Edit"
                  className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
            {onDelete && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(process.id);
                  }}
                  title="Delete"
                  className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
