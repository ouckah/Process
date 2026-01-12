'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProfileStatsProps {
  stats: {
    total_public_processes: number;
    offers_received: number;
    active_applications: number;
    rejected: number;
    success_rate: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const statItems = [
    { label: 'TOTAL', value: stats.total_public_processes, bg: 'bg-indigo-600 dark:bg-indigo-500', rotation: '-rotate-1' },
    { label: 'OFFERS', value: stats.offers_received, bg: 'bg-green-600 dark:bg-green-500', rotation: 'rotate-1' },
    { label: 'ACTIVE', value: stats.active_applications, bg: 'bg-blue-600 dark:bg-blue-500', rotation: '-rotate-1' },
    { label: 'REJECTED', value: stats.rejected, bg: 'bg-red-600 dark:bg-red-500', rotation: 'rotate-1' },
    { label: 'SUCCESS', value: `${stats.success_rate}%`, bg: 'bg-amber-600 dark:bg-amber-500', rotation: '-rotate-1' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
          <div className={`relative ${stat.bg} border-4 border-ink-900 dark:border-cream-50 p-5 transform ${stat.rotation} group-hover:rotate-0 transition-transform`}>
            <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
            <div className="text-xs uppercase tracking-widest font-black text-white opacity-90">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
