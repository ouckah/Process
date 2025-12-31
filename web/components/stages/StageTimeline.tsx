'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { getStageDisplayName } from '@/lib/stageTypes';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';
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
      <div className="text-center py-8 text-gray-500">
        No stages yet. Add your first stage to see the timeline!
      </div>
    );
  }

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

      <div className="space-y-6">
        {sortedStages.map((stage, index) => (
          <div
            key={stage.id}
            className="relative flex items-start space-x-4 group"
          >
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white border-4 border-primary-500 rounded-full">
              <span className="text-sm font-semibold text-primary-600">{stage.order}</span>
            </div>

            {/* Content */}
            <div className="flex-1 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900">{getStageDisplayName(stage.stage_name)}</h4>
                    <span className="text-sm text-gray-500">{formatDate(stage.stage_date)}</span>
                  </div>
                  {stage.notes && (
                    <p className="text-sm text-gray-600">{stage.notes}</p>
                  )}
                </div>
                {(onEdit || onDelete) && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(stage);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(stage.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

