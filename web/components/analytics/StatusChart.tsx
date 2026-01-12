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
      <div className="relative group">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 flex items-center justify-center h-64 transform -rotate-1">
          <p className="font-body text-ink-700 dark:text-ink-300 font-bold uppercase tracking-wider">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
      <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1 group-hover:rotate-0 transition-transform">
        <div className="mb-6">
          <div className="inline-block bg-indigo-600 dark:bg-indigo-500 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-3">
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">Stage Distribution</h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={filteredStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.1} />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }}
            />
            <YAxis tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgb(var(--color-cream-50))',
                border: '4px solid rgb(var(--color-ink-900))',
                borderRadius: '0',
                fontWeight: 'bold',
              }}
            />
            <Bar dataKey="count" radius={0}>
              {filteredStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

