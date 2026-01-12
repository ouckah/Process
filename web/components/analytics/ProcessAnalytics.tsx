'use client';

import React, { useMemo } from 'react';
import { useProcesses } from '@/hooks/useProcesses';
import { useQueries } from '@tanstack/react-query';
import { processApi } from '@/lib/api';
import { MetricsCards } from './MetricsCards';
import { StatusChart } from './StatusChart';
import { SankeyChart } from './SankeyChart';
import { TimelineChart } from './TimelineChart';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block bg-ink-900 dark:bg-cream-50 px-6 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1">
          <p className="font-body text-sm uppercase tracking-widest font-black text-cream-50 dark:text-ink-900">
            NO DATA YET
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <MetricsCards processes={processes} processDetails={processDetails} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-block bg-ink-900 dark:bg-cream-50 px-6 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-6">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
            Analytics Overview
          </h2>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatusChart processes={processes} processDetails={processDetails} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TimelineChart processes={processes} processDetails={processDetails} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full"
      >
        <SankeyChart processes={processes} processDetails={processDetails} />
      </motion.div>
    </div>
  );
}
