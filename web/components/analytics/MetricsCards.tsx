'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Process, ProcessDetail } from '@/types';

interface MetricsCardsProps {
  processes: Process[];
  processDetails?: ProcessDetail[];
}

export function MetricsCards({ processes, processDetails = [] }: MetricsCardsProps) {
  const totalProcesses = processes.length;
  const activeCount = processes.filter(p => p.status === 'active').length;
  const completedCount = processes.filter(p => p.status === 'completed').length;
  const rejectedCount = processes.filter(p => p.status === 'rejected').length;
  
  // Calculate success rate
  const totalCompleted = completedCount + rejectedCount;
  const successRate = totalCompleted > 0 
    ? Math.round((completedCount / totalCompleted) * 100) 
    : 0;

  // Calculate average stages per process
  const totalStages = processDetails.reduce((sum, pd) => sum + (pd.stages?.length || 0), 0);
  const avgStages = totalProcesses > 0 
    ? (totalStages / totalProcesses).toFixed(1) 
    : '0';

  // Calculate average time to completion (for completed processes)
  const completedProcesses = processDetails.filter(pd => pd.status === 'completed');
  const avgCompletionTime = completedProcesses.length > 0
    ? completedProcesses.reduce((sum, pd) => {
        if (pd.stages && pd.stages.length > 0) {
          const firstStage = pd.stages[0];
          const lastStage = pd.stages[pd.stages.length - 1];
          const days = Math.floor(
            (new Date(lastStage.stage_date).getTime() - new Date(firstStage.stage_date).getTime()) 
            / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0) / completedProcesses.length
    : 0;

  const metrics = [
    {
      label: 'TOTAL',
      value: totalProcesses,
      bg: 'bg-indigo-600 dark:bg-indigo-500',
      text: 'text-white',
      rotation: '-rotate-1',
    },
    {
      label: 'ACTIVE',
      value: activeCount,
      bg: 'bg-blue-600 dark:bg-blue-500',
      text: 'text-white',
      rotation: 'rotate-1',
    },
    {
      label: 'DONE',
      value: completedCount,
      bg: 'bg-green-600 dark:bg-green-500',
      text: 'text-white',
      rotation: '-rotate-1',
    },
    {
      label: 'REJECTED',
      value: rejectedCount,
      bg: 'bg-red-600 dark:bg-red-500',
      text: 'text-white',
      rotation: 'rotate-1',
    },
    {
      label: 'SUCCESS RATE',
      value: `${successRate}%`,
      bg: 'bg-purple-600 dark:bg-purple-500',
      text: 'text-white',
      rotation: '-rotate-1',
    },
    {
      label: 'AVG STAGES',
      value: avgStages,
      bg: 'bg-amber-600 dark:bg-amber-500',
      text: 'text-white',
      rotation: 'rotate-1',
    },
    {
      label: 'AVG DAYS',
      value: avgCompletionTime > 0 ? Math.round(avgCompletionTime) : 'N/A',
      bg: 'bg-teal-600 dark:bg-teal-500',
      text: 'text-white',
      rotation: '-rotate-1',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
          <div className={`relative ${metric.bg} border-4 border-ink-900 dark:border-cream-50 p-4 transform ${metric.rotation} group-hover:rotate-0 transition-transform`}>
            <div className={`text-3xl font-black ${metric.text} mb-2`}>{metric.value}</div>
            <div className={`text-xs uppercase tracking-widest font-black ${metric.text} opacity-90`}>
              {metric.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
