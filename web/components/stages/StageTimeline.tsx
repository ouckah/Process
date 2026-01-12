'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { getStageDisplayName } from '@/lib/stageTypes';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Stage } from '@/types';

interface StageTimelineProps {
  stages: Stage[];
  onStageClick?: (stage: Stage) => void;
  onEdit?: (stage: Stage) => void;
  onDelete?: (id: number) => void;
}

export function StageTimeline({ stages, onStageClick, onEdit, onDelete }: StageTimelineProps) {
  if (stages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-ink-900 dark:bg-cream-50 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
          <p className="font-body text-base font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
            No stages yet. Add your first stage to see the timeline!
          </p>
        </div>
      </div>
    );
  }

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedStages.map((stage, index) => {
        const rotation = index % 2 === 0 ? 'rotate-1' : '-rotate-1';
        
        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
            <div className={`relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform ${rotation}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Stage Number */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-1 translate-y-1"></div>
                    <div className="relative w-16 h-16 bg-indigo-600 dark:bg-indigo-500 border-4 border-ink-900 dark:border-cream-50 flex items-center justify-center transform -rotate-1">
                      <span className="font-display text-2xl font-black text-white">{stage.order}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-3">
                      <h4 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                        {getStageDisplayName(stage.stage_name)}
                      </h4>
                    </div>
                    
                    <div className="bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                      <p className="font-body text-sm font-black uppercase tracking-wider text-white">
                        {formatDate(stage.stage_date)}
                      </p>
                    </div>

                    {/* Notes */}
                    {stage.notes && (
                      <div className="bg-cream-100 dark:bg-ink-800 px-4 py-3 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mt-4">
                        <p className="font-body text-sm text-ink-900 dark:text-cream-50 leading-relaxed font-bold whitespace-pre-wrap">
                          {stage.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {(onEdit || onDelete) && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {onEdit && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(stage);
                          }}
                          className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )}
                    {onDelete && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(stage.id);
                          }}
                          className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
