'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import type { Notification } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import { MessageSquare, HelpCircle, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';

interface NotificationInboxProps {
  onClose?: () => void;
  onNotificationRead?: () => void;
}

export function NotificationInbox({ onClose, onNotificationRead }: NotificationInboxProps) {
  const queryClient = useQueryClient();
  const [markingAll, setMarkingAll] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      onNotificationRead?.();
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      onNotificationRead?.();
      setMarkingAll(false);
    },
  });

  const handleMarkAsRead = (notification: Notification, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    setMarkingAll(true);
    markAllAsReadMutation.mutate();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-cream-50 dark:bg-ink-950">
      {/* Header */}
      <div className="relative group p-4 border-b-4 border-ink-900 dark:border-cream-50">
        <div className="flex items-center justify-between">
          <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
              Notifications
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider text-xs"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              </motion.div>
            )}
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="bg-ink-900 dark:bg-cream-50 w-8 h-8 border-4 border-ink-900 dark:border-cream-50 flex items-center justify-center transform rotate-1"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-cream-50 dark:text-ink-900" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="bg-ink-900 dark:bg-cream-50 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
              <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                Loading notifications...
              </p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-16 h-16 text-ink-400 dark:text-ink-500" />}
            title="No notifications"
            description="You're all caught up! New comments and questions will appear here."
            hideAction={true}
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, idx) => {
              const authorName = notification.author_username || notification.author_display_name || 'Anonymous User';
              const profileLink = notification.profile_username 
                ? `/profile/${notification.profile_username}`
                : '#';
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link
                    href={profileLink}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsReadMutation.mutate(notification.id);
                      }
                      onClose?.();
                    }}
                    className="block"
                  >
                    <div className={`relative group ${
                      !notification.is_read ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-cream-100 dark:bg-ink-800'
                    } border-4 border-ink-900 dark:border-cream-50 p-4 transform ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
                      <div className="flex items-start space-x-4">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-1 translate-y-1"></div>
                          <div className="relative">
                            <Avatar
                              discordAvatar={notification.author_discord_avatar}
                              discordId={notification.author_discord_id}
                              username={authorName}
                              size="md"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {notification.type === 'question' ? (
                              <div className="bg-blue-600 dark:bg-blue-500 px-2 py-0.5 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                                <HelpCircle className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="bg-ink-900 dark:bg-cream-50 px-2 py-0.5 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                                <MessageSquare className="w-4 h-4 text-cream-50 dark:text-ink-900" />
                              </div>
                            )}
                            <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
                              <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                                {notification.type === 'question' ? 'New question' : 'New comment'} from {authorName}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="bg-blue-600 dark:bg-blue-500 w-3 h-3 border-2 border-ink-900 dark:border-cream-50"></div>
                            )}
                          </div>
                          {notification.comment_content && (
                            <div className="bg-cream-50 dark:bg-ink-900 px-3 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-2">
                              <p className="font-body text-xs text-ink-900 dark:text-cream-50 line-clamp-2 font-bold">
                                {notification.comment_content}
                              </p>
                            </div>
                          )}
                          <div className="bg-ink-900 dark:bg-cream-50 px-2 py-0.5 border border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
                            <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleMarkAsRead(notification, e)}
                            className="bg-red-600 dark:bg-red-500 w-6 h-6 border-2 border-ink-900 dark:border-cream-50 flex items-center justify-center flex-shrink-0 transform -rotate-1"
                            aria-label="Mark as read"
                          >
                            <X className="w-3 h-3 text-white" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t-4 border-ink-900 dark:border-cream-50 text-center">
          <Link
            href="/notifications"
            onClick={onClose}
            className="inline-block"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <div className="bg-indigo-600 dark:bg-indigo-500 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <span className="font-body text-sm font-black uppercase tracking-wider text-white">
                  View all notifications
                </span>
              </div>
            </motion.div>
          </Link>
        </div>
      )}
    </div>
  );
}
