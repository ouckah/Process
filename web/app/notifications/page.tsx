'use client';

import React from 'react';
import { NotificationInbox } from '@/components/notifications/NotificationInbox';

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Stay updated on comments and questions on your profile
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <NotificationInbox />
      </div>
    </div>
  );
}

