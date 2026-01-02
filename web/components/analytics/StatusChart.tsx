'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Process, ProcessDetail } from '@/types';

interface StatusChartProps {
  processes: Process[];
  processDetails?: ProcessDetail[];
}

const COLORS: Record<string, string> = {
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

  // Calculate status distribution based on most recent stage name
  // This includes all stage names including "Offer" and "Reject" as valid stage names
  const statusData = useMemo(() => {
    const stageCounts: Record<string, number> = {};

    processes.forEach(process => {
      const detail = processDetailsMap.get(process.id);
      let stageName = 'Active'; // Default if no stages

      if (detail?.stages && detail.stages.length > 0) {
        // Find the most recent stage by order (highest order number = most recent)
        // This will correctly identify "Offer" and "Reject" stages as the most recent
        const mostRecentStage = detail.stages.reduce((latest, stage) => {
          return stage.order > latest.order ? stage : latest;
        }, detail.stages[0]);
        
        // Use the most recent stage name (could be "Offer", "Reject", or any other stage)
        stageName = mostRecentStage.stage_name;
      }

      // Count all stage names including "Offer" and "Reject"
      stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
    });

    // Convert to array format for chart
    return Object.entries(stageCounts)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS[name] || COLORS['Other'],
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [processes, processDetailsMap]);

  const filteredStatusData = statusData.filter(item => item.value > 0);

  if (filteredStatusData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Status Distribution (Most Recent Stage)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredStatusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {filteredStatusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

