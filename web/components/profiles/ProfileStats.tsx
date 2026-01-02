'use client';

import React from 'react';

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_public_processes}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.offers_received}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Offers</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active_applications}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4">
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4">
        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.success_rate}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
      </div>
    </div>
  );
}

