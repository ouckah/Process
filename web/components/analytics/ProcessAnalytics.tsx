'use client';

import React, { useMemo } from 'react';
import { useProcesses } from '@/hooks/useProcesses';
import { useQueries } from '@tanstack/react-query';
import { processApi } from '@/lib/api';
import { MetricsCards } from './MetricsCards';
import { StatusChart } from './StatusChart';
import { TimelineChart } from './TimelineChart';
import { Loader2 } from 'lucide-react';
import type { ProcessDetail } from '@/types';

export function ProcessAnalytics() {
  const { data: processes, isLoading } = useProcesses();

  // Fetch all process details in parallel
  const processDetailQueries = useQueries({
    queries: (processes || []).map((process) => ({
      queryKey: ['process', process.id, 'detail'],
      queryFn: () => processApi.getDetail(process.id),
      enabled: !!processes && processes.length > 0,
    })),
  });

  const processDetails = useMemo(() => {
    return processDetailQueries
      .map((query) => query.data)
      .filter((detail): detail is ProcessDetail => detail !== undefined);
  }, [processDetailQueries]);

  const isLoadingDetails = processDetailQueries.some((query) => query.isLoading);

  if (isLoading || isLoadingDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No processes to analyze yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Analytics Overview</h2>
        <MetricsCards processes={processes} processDetails={processDetails} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart processes={processes} processDetails={processDetails} />
        <TimelineChart processes={processes} processDetails={processDetails} />
      </div>
    </div>
  );
}

