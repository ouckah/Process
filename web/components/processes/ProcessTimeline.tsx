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
    <div className="relative group">
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
      <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
        <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-6">
          <h3 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
            Process Timeline
          </h3>
        </div>
        <StageTimeline stages={process.stages} onStageClick={onStageClick} />
      </div>
    </div>
  );
}
