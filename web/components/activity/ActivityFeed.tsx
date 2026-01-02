'use client';

import React, { useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { Clock, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type { Process, ProcessDetail, Stage } from '@/types';

interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'stage_added' | 'stage_updated' | 'stage_deleted';
  processId: number;
  processName: string;
  timestamp: string;
  description: string;
}

interface ActivityFeedProps {
  processes: Process[];
  processDetails?: ProcessDetail[];
}

export function ActivityFeed({ processes, processDetails = [] }: ActivityFeedProps) {
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Process activities
    processes.forEach(process => {
      items.push({
        id: `process-created-${process.id}`,
        type: 'created',
        processId: process.id,
        processName: process.company_name,
        timestamp: process.created_at,
        description: `Created process for ${process.company_name}`,
      });

      if (process.updated_at !== process.created_at) {
        items.push({
          id: `process-updated-${process.id}`,
          type: 'updated',
          processId: process.id,
          processName: process.company_name,
          timestamp: process.updated_at,
          description: `Updated ${process.company_name}`,
        });
      }
    });

    // Stage activities
    processDetails.forEach(processDetail => {
      if (processDetail.stages) {
        processDetail.stages.forEach(stage => {
          items.push({
            id: `stage-created-${stage.id}`,
            type: 'stage_added',
            processId: processDetail.id,
            processName: processDetail.company_name,
            timestamp: stage.created_at,
            description: `Added stage "${stage.stage_name}" to ${processDetail.company_name}`,
          });

          if (stage.updated_at !== stage.created_at) {
            items.push({
              id: `stage-updated-${stage.id}`,
              type: 'stage_updated',
              processId: processDetail.id,
              processName: processDetail.company_name,
              timestamp: stage.updated_at,
              description: `Updated stage "${stage.stage_name}" for ${processDetail.company_name}`,
            });
          }
        });
      }
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10); // Show last 10 activities
  }, [processes, processDetails]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'created':
      case 'stage_added':
        return <Plus className="w-4 h-4 text-green-500 dark:text-green-400" />;
      case 'updated':
      case 'stage_updated':
        return <Edit className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case 'deleted':
      case 'stage_deleted':
        return <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
          >
            <div className="mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

