'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/utils';
import type { ProfileComment } from '@/types';
import { MessageSquare, Reply, Edit, Trash2, CheckCircle, MoreVertical, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface CommentItemProps {
  comment: ProfileComment;
  username: string;
  isProfileOwner: boolean;
  onReply: (commentId: number) => void;
  onEdit: (comment: ProfileComment) => void;
  onDelete: (commentId: number) => void;
  onMarkAsAnswered: (commentId: number) => void;
  onUpvote: (commentId: number) => void;
  depth?: number;
}

export function CommentItem({
  comment,
  username,
  isProfileOwner,
  onReply,
  onEdit,
  onDelete,
  onMarkAsAnswered,
  onUpvote,
  depth = 0,
}: CommentItemProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(true);
  const isAuthor = user && comment.author_id === user.id;
  const canModerate = isProfileOwner || isAuthor;
  const maxDepth = 3; // Limit nesting depth

  const authorName = comment.author_username || comment.author_display_name || 'Anonymous User';
  const rotation = depth % 2 === 0 ? '-rotate-1' : 'rotate-1';

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-6' : ''}`}>
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ duration: 0.2 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
        <div className={`relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform ${rotation} group-hover:rotate-0 transition-transform`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-1 translate-y-1"></div>
                <div className="relative">
                  <Avatar
                    discordAvatar={comment.author_discord_avatar}
                    discordId={comment.author_discord_id}
                    username={comment.author_username || authorName}
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <p className="font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                    {authorName}
                  </p>
                  {comment.is_question && (
                    <div className="bg-blue-600 dark:bg-blue-500 px-2 py-0.5 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                      <span className="font-body text-xs font-black uppercase tracking-wider text-white">
                        Question
                      </span>
                    </div>
                  )}
                  {comment.is_question && comment.is_answered && (
                    <div className="bg-green-600 dark:bg-green-500 px-2 py-0.5 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1 text-white" />
                      <span className="font-body text-xs font-black uppercase tracking-wider text-white">
                        Answered
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-ink-900 dark:bg-cream-50 px-2 py-0.5 border border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
                  <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                    {formatDate(comment.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-6 pr-4 whitespace-pre-wrap text-ink-900 dark:text-cream-50 font-body leading-relaxed">
            {comment.content}
          </div>

          {/* Actions */}
          <div className="flex items-center flex-wrap gap-3 mt-6 pt-4 border-t-4 border-ink-900 dark:border-cream-50">
            {user && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onUpvote(comment.id)}
                className={`flex items-center space-x-2 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider text-sm ${
                  comment.user_has_upvoted
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                    : 'bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800'
                } transition-colors`}
              >
                <ChevronUp className={`w-4 h-4 ${comment.user_has_upvoted ? 'fill-current' : ''}`} />
                <span>{comment.upvotes || 0}</span>
              </motion.button>
            )}
            {!user && (
              <div className="flex items-center space-x-2 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50">
                <ChevronUp className="w-4 h-4" />
                <span className="font-body text-sm font-black uppercase tracking-wider">{comment.upvotes || 0}</span>
              </div>
            )}

            {depth < maxDepth && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReply(comment.id)}
                className="px-3 py-1 border-2 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 font-black uppercase tracking-wider text-sm flex items-center space-x-2 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </motion.button>
            )}

            {isAuthor && !comment.author_id && (
              <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <span className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                  Anonymous - cannot edit
                </span>
              </div>
            )}

            {isAuthor && comment.author_id && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(comment)}
                className="px-3 py-1 border-2 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 font-black uppercase tracking-wider text-sm flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </motion.button>
            )}

            {canModerate && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(comment.id)}
                className="px-3 py-1 border-2 border-ink-900 dark:border-cream-50 bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 font-black uppercase tracking-wider text-sm flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </motion.button>
            )}

            {isProfileOwner && comment.is_question && !comment.is_answered && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMarkAsAnswered(comment.id)}
                className="px-3 py-1 border-2 border-ink-900 dark:border-cream-50 bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 font-black uppercase tracking-wider text-sm flex items-center space-x-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Answered</span>
              </motion.button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowReplies(!showReplies)}
                className="mb-4 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 bg-ink-900 dark:bg-cream-50 text-cream-50 dark:text-ink-900 font-black uppercase tracking-wider text-sm transform -rotate-1 hover:rotate-0 transition-transform"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </motion.button>
              {showReplies && (
                <div className="space-y-6">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      username={username}
                      isProfileOwner={isProfileOwner}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onMarkAsAnswered={onMarkAsAnswered}
                      onUpvote={onUpvote}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
