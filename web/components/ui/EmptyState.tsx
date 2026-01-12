'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { FileText, Search, Plus, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  type?: 'no-processes' | 'no-results' | 'first-time' | 'forum';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  hideAction?: boolean; // Explicitly hide the action button
  hideQuickStart?: boolean; // Hide the Quick Start Guide section
}

export function EmptyState({
  type = 'no-processes',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  hideAction = false,
  hideQuickStart = false,
}: EmptyStateProps) {
  // Default content based on type
  const getDefaultContent = () => {
    switch (type) {
      case 'no-processes':
        return {
          icon: <FileText className="w-16 h-16 text-ink-400 dark:text-ink-500" />,
          title: title || "No processes yet",
          description: description || "Start tracking your job applications by creating your first process.",
          actionLabel: actionLabel || "Create Process",
          actionHref: actionHref || "/processes/new",
        };
      case 'no-results':
        return {
          icon: <Search className="w-16 h-16 text-ink-400 dark:text-ink-500" />,
          title: title || "No results found",
          description: description || "Try adjusting your search or filters to find what you're looking for.",
          actionLabel: actionLabel || "Clear Filters",
        };
      case 'first-time':
        return {
          icon: <BookOpen className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />,
          title: title || "Welcome to Process!",
          description: description || "Track your job applications, manage stages, and visualize your progress all in one place.",
          actionLabel: actionLabel || "Get Started",
          actionHref: actionHref || (onAction ? undefined : "/processes/new"),
        };
      default:
        return {
          icon: <FileText className="w-16 h-16 text-ink-400 dark:text-ink-500" />,
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
    <div className="text-center py-12 px-4 pb-16">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          {displayIcon}
        </motion.div>
        
        <div className="relative flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative group inline-block z-20"
          >
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
            <div className="relative bg-ink-900 dark:bg-cream-50 px-6 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1">
              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                {displayTitle}
              </h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative group inline-block z-10 -mt-3"
          >
            <div className="absolute inset-0 bg-cream-100 dark:bg-ink-800 translate-x-1 translate-y-1"></div>
            <div className="relative bg-cream-100 dark:bg-ink-800 px-6 py-3 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 max-w-md pt-8">
              <p className="font-body text-ink-700 dark:text-ink-300 font-bold uppercase tracking-wider">
                {displayDescription}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      
      {type === 'first-time' && !hideQuickStart && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative group mb-8 max-w-2xl mx-auto text-left mt-12"
        >
          <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-2 translate-y-2"></div>
          <div className="relative bg-indigo-600 dark:bg-indigo-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
            <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
              <h4 className="font-display text-lg font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Quick Start Guide
              </h4>
            </div>
            <ol className="list-decimal list-inside space-y-3 font-body text-sm text-white font-bold uppercase tracking-wider">
              <li>Create a process for each job application you're tracking</li>
              <li>Add stages as you progress through the interview process</li>
              <li>Update stages with dates and notes to keep track of your progress</li>
              <li>Use the dashboard to see an overview of all your applications</li>
            </ol>
          </div>
        </motion.div>
      )}

      {!hideAction && (content.actionHref || actionHref || onAction) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex justify-center gap-3 mt-8"
        >
          {onAction ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={onAction} className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider">
                <Plus className="w-5 h-5 mr-2" />
                {displayActionLabel}
              </Button>
            </motion.div>
          ) : (content.actionHref || actionHref) ? (
            <Link href={content.actionHref || actionHref || '#'}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider">
                  <Plus className="w-5 h-5 mr-2" />
                  {displayActionLabel}
                </Button>
              </motion.div>
            </Link>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
