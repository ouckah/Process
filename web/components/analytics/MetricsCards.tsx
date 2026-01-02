'use client';

import React from 'react';
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
      label: 'Total Processes',
      value: totalProcesses,
      color: 'text-gray-900 dark:text-gray-100',
    },
    {
      label: 'Active',
      value: activeCount,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Completed',
      value: completedCount,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Rejected',
      value: rejectedCount,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Avg Stages',
      value: avgStages,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Avg Days to Complete',
      value: avgCompletionTime > 0 ? Math.round(avgCompletionTime) : 'N/A',
      color: 'text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4">
          <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}

