'use client';

import React from 'react';
import { StageItem } from './StageItem';
import type { Stage } from '@/types';

interface StageListProps {
  stages: Stage[];
  onEdit?: (stage: Stage) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function StageList({ stages, onEdit, onDelete, showActions = true }: StageListProps) {
  if (stages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No stages yet. Add your first stage to get started!
      </div>
    );
  }

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      {sortedStages.map((stage) => (
        <StageItem
          key={stage.id}
          stage={stage}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

