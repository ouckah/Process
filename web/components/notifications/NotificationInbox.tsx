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
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notifications
        </h2>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="text-xs"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-500" />}
            title="No notifications"
            description="You're all caught up! New comments and questions will appear here."
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => {
              const authorName = notification.author_username || notification.author_display_name || 'Anonymous User';
              const profileLink = notification.profile_username 
                ? `/profile/${notification.profile_username}`
                : '#';
              
              return (
                <Link
                  key={notification.id}
                  href={profileLink}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsReadMutation.mutate(notification.id);
                    }
                    onClose?.();
                  }}
                  className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar
                      discordAvatar={notification.author_discord_avatar}
                      discordId={notification.author_discord_id}
                      username={authorName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {notification.type === 'question' ? (
                          <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.type === 'question' ? 'New question' : 'New comment'} from {authorName}
                        </p>
                        {!notification.is_read && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      {notification.comment_content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                          {notification.comment_content}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification, e)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        aria-label="Mark as read"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

