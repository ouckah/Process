'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { getStageDisplayName } from '@/lib/stageTypes';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Stage } from '@/types';

interface StageItemProps {
  stage: Stage;
  onEdit?: (stage: Stage) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function StageItem({ stage, onEdit, onDelete, showActions = true }: StageItemProps) {
  const displayName = getStageDisplayName(stage.stage_name);
  
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{stage.order}</span>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{displayName}</h4>
        </div>
        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{formatDate(stage.stage_date)}</span>
          {stage.notes && (
            <span className="text-gray-500 dark:text-gray-500">• {stage.notes}</span>
          )}
        </div>
      </div>
      {showActions && (onEdit || onDelete) && (
        <div className="flex items-center space-x-2 ml-4">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(stage)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(stage.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

