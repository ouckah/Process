'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { FileText, Search, Plus, BookOpen } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-processes' | 'no-results' | 'first-time';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  type = 'no-processes',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps) {
  // Default content based on type
  const getDefaultContent = () => {
    switch (type) {
      case 'no-processes':
        return {
          icon: <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500" />,
          title: title || "No processes yet",
          description: description || "Start tracking your job applications by creating your first process.",
          actionLabel: actionLabel || "Create Process",
          actionHref: actionHref || "/processes/new",
        };
      case 'no-results':
        return {
          icon: <Search className="w-16 h-16 text-gray-400 dark:text-gray-500" />,
          title: title || "No results found",
          description: description || "Try adjusting your search or filters to find what you're looking for.",
          actionLabel: actionLabel || "Clear Filters",
        };
      case 'first-time':
        return {
          icon: <BookOpen className="w-16 h-16 text-primary-500 dark:text-primary-400" />,
          title: title || "Welcome to Process!",
          description: description || "Track your job applications, manage stages, and visualize your progress all in one place.",
          actionLabel: actionLabel || "Get Started",
          actionHref: actionHref || "/processes/new",
        };
      default:
        return {
          icon: <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500" />,
          title: title || "Nothing here",
          description: description || "Get started by creating your first item.",
          actionLabel: actionLabel || "Create",
        };
    }
  };

  const content = getDefaultContent();
  const displayIcon = icon || content.icon;
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;
  const displayActionLabel = actionLabel || content.actionLabel;

  return (
    <div className="text-center py-12 px-4">
      <div className="flex justify-center mb-4">
        {displayIcon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{displayTitle}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{displayDescription}</p>
      
      {type === 'first-time' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6 max-w-2xl mx-auto text-left">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Quick Start Guide</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>Create a process for each job application you're tracking</li>
            <li>Add stages as you progress through the interview process</li>
            <li>Update stages with dates and notes to keep track of your progress</li>
            <li>Use the dashboard to see an overview of all your applications</li>
          </ol>
        </div>
      )}

      {(content.actionHref || actionHref || onAction) && (
        <div className="flex justify-center gap-3">
          {content.actionHref || actionHref ? (
            <Link href={content.actionHref || actionHref || '#'}>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                {displayActionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction}>
              <Plus className="w-5 h-5 mr-2" />
              {displayActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

