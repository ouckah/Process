'use client';

import React from 'react';
import { StageTimeline } from '@/components/stages/StageTimeline';
import type { ProcessDetail } from '@/types';

interface ProcessTimelineProps {
  process: ProcessDetail;
  onStageClick?: (stage: any) => void;
}

export function ProcessTimeline({ process, onStageClick }: ProcessTimelineProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Process Timeline</h3>
      <StageTimeline stages={process.stages} onStageClick={onStageClick} />
    </div>
  );
}

