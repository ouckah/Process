'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Process, ProcessDetail } from '@/types';

interface StatusChartProps {
  processes: Process[];
  processDetails?: ProcessDetail[];
}

const COLORS: Record<string, string> = {
  'Applied': '#FDE68A', // pastel yellow
  'OA': '#3B82F6', // blue
  'Phone Screen': '#60A5FA', // light blue
  'Technical Interview': '#818CF8', // indigo
  'HM Interview': '#A78BFA', // purple
  'Final Interview': '#C084FC', // light purple
  'On-site Interview': '#E879F9', // pink
  'Take-home Assignment': '#F472B6', // rose
  'System Design': '#FB7185', // rose
  'Behavioral Interview': '#F87171', // red
  'Coding Challenge': '#EF4444', // red
  'Offer': '#10B981', // green
  'Reject': '#EF4444', // red
  'Other': '#6B7280', // gray
};

export function StatusChart({ processes, processDetails = [] }: StatusChartProps) {
  // Map process IDs to their details for quick lookup
  const processDetailsMap = useMemo(() => {
    const map = new Map<number, ProcessDetail>();
    processDetails.forEach(pd => map.set(pd.id, pd));
    return map;
  }, [processDetails]);

  // Calculate aggregated count of each stage name across all processes
  // Count ALL stages, not just the most recent one
  const statusData = useMemo(() => {
    const stageCounts: Record<string, number> = {};

    processes.forEach(process => {
      const detail = processDetailsMap.get(process.id);
      
      if (detail?.stages && detail.stages.length > 0) {
        // Count every stage, not just the most recent
        detail.stages.forEach(stage => {
          const stageName = stage.stage_name;
          stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
        });
      }
    });

    // Convert to array format for chart
    return Object.entries(stageCounts)
      .map(([name, value]) => ({
        name,
        count: value,
        color: COLORS[name] || COLORS['Other'],
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [processes, processDetailsMap]);

  const filteredStatusData = statusData.filter(item => item.count > 0);

  if (filteredStatusData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Stage Distribution (All Stages)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={filteredStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {filteredStatusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

