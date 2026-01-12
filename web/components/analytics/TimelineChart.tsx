'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Process, ProcessDetail } from '@/types';

interface TimelineChartProps {
  processes: Process[];
  processDetails?: ProcessDetail[];
}

export function TimelineChart({ processes, processDetails = [] }: TimelineChartProps) {
  const timelineData = useMemo(() => {
    // Map process IDs to their details for quick lookup
    const processDetailsMap = new Map<number, ProcessDetail>();
    processDetails.forEach(pd => processDetailsMap.set(pd.id, pd));

    // First, collect all stages with their dates
    const allStages: Array<{ stage_name: string; date: Date; dayKey: string }> = [];
    
    processes.forEach(process => {
      const detail = processDetailsMap.get(process.id);
      if (detail?.stages) {
        detail.stages.forEach(stage => {
          const stageDate = new Date(stage.stage_date);
          const dayKey = `${stageDate.getFullYear()}-${String(stageDate.getMonth() + 1).padStart(2, '0')}-${String(stageDate.getDate()).padStart(2, '0')}`;
          allStages.push({
            stage_name: stage.stage_name,
            date: stageDate,
            dayKey,
          });
        });
      }
    });

    // Get all unique days and sort them
    const allDays = Array.from(new Set(allStages.map(s => s.dayKey))).sort();

    // Build cumulative data - for each day, count all stages up to that day
    const cumulativeData: Array<Record<string, any>> = [];
    const cumulativeCounts: Record<string, number> = {}; // Track running totals

    allDays.forEach(dayKey => {
      const [year, month, day] = dayKey.split('-').map(Number);
      const dayLabel = new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const currentDate = new Date(year, month - 1, day, 23, 59, 59); // End of day

      // Count stages that occurred on or before this day
      const dayCounts: Record<string, number> = {};
      allStages.forEach(stage => {
        if (stage.date <= currentDate) {
          dayCounts[stage.stage_name] = (dayCounts[stage.stage_name] || 0) + 1;
        }
      });

      // Update cumulative counts (this ensures steady increase)
      Object.keys(dayCounts).forEach(stageName => {
        cumulativeCounts[stageName] = dayCounts[stageName];
      });

      cumulativeData.push({
        date: dayLabel,
        ...cumulativeCounts,
      });
    });

    return cumulativeData;
  }, [processes, processDetails]);

  if (timelineData.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 flex items-center justify-center h-64 transform rotate-1">
          <p className="font-body text-ink-700 dark:text-ink-300 font-bold uppercase tracking-wider">No data to display</p>
        </div>
      </div>
    );
  }

  // Show placeholder if less than 3 days of data
  if (timelineData.length < 3) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
          <div className="mb-6">
            <div className="inline-block bg-amber-600 dark:bg-amber-500 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mb-3">
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">Process Timeline</h3>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="font-body text-ink-700 dark:text-ink-300 font-bold mb-2 uppercase tracking-wider">
              Timeline requires at least 3 days of data
            </p>
            <p className="font-body text-sm text-ink-600 dark:text-ink-400 uppercase tracking-wider">
              Add more stages to see progression
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get all unique stage names that appear in the data
  const allStageNames = new Set<string>();
  timelineData.forEach(day => {
    Object.keys(day).forEach(key => {
      if (key !== 'date') {
        allStageNames.add(key);
      }
    });
  });

  // Define stage colors and order (most important first)
  const stageColors: Record<string, string> = {
    'Offer': '#10B981',
    'Reject': '#EF4444',
    'Applied': '#FDE68A', // pastel yellow
    'OA': '#3B82F6',
    'Phone Screen': '#60A5FA',
    'Technical Interview': '#818CF8',
    'HM Interview': '#A78BFA',
    'Final Interview': '#C084FC',
    'On-site Interview': '#E879F9',
    'Take-home Assignment': '#F472B6',
    'System Design': '#FB7185',
    'Behavioral Interview': '#F87171',
    'Coding Challenge': '#EF4444',
    'Active': '#9CA3AF',
  };

  // Sort stage names: Offer/Reject first, then others alphabetically
  const sortedStageNames = Array.from(allStageNames).sort((a, b) => {
    if (a === 'Offer') return -1;
    if (b === 'Offer') return 1;
    if (a === 'Reject') return -1;
    if (b === 'Reject') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
      <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1 group-hover:rotate-0 transition-transform">
        <div className="mb-6">
          <div className="inline-block bg-amber-600 dark:bg-amber-500 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mb-3">
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">Process Timeline</h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.1} />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval="preserveStartEnd"
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
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => <span className="text-sm font-bold">{value}</span>}
            />
            {/* Dynamically render lines for all stage names that appear */}
            {sortedStageNames.map((stageName) => (
              <Line
                key={stageName}
                type="monotone"
                dataKey={stageName}
                stroke={stageColors[stageName] || '#6B7280'}
                name={stageName}
                strokeWidth={stageName === 'Offer' || stageName === 'Reject' ? 3 : 2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

