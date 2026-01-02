import React from 'react';
import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'completed' | 'rejected' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const colors = {
    active: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    completed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = status === 'active' ? 'active' : status === 'completed' ? 'completed' : status === 'rejected' ? 'rejected' : 'default';
  return <Badge variant={variant}>{status}</Badge>;
}

