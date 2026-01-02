'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/utils';
import type { ProfileComment } from '@/types';
import { MessageSquare, Reply, Edit, Trash2, CheckCircle, MoreVertical, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
// Using simple markdown rendering for now - can upgrade to react-markdown if needed

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

  return (
    <div className={`${depth > 0 ? 'ml-6 mt-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm dark:shadow-gray-900/50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                {authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center flex-wrap gap-2">
                <span>{authorName}</span>
                {comment.is_question && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    Question
                  </span>
                )}
                {comment.is_question && comment.is_answered && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded inline-flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Answered
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none mb-3 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
          {comment.content}
        </div>

        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {user && (
            <button
              onClick={() => onUpvote(comment.id)}
              className={`flex items-center space-x-1 text-sm ${
                comment.user_has_upvoted
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              <ChevronUp className={`w-4 h-4 ${comment.user_has_upvoted ? 'fill-current' : ''}`} />
              <span>{comment.upvotes || 0}</span>
            </button>
          )}
          {!user && (
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <ChevronUp className="w-4 h-4" />
              <span>{comment.upvotes || 0}</span>
            </div>
          )}

          {depth < maxDepth && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
          )}

          {isAuthor && !comment.author_id && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Anonymous comments cannot be edited
            </span>
          )}

          {isAuthor && comment.author_id && (
            <button
              onClick={() => onEdit(comment)}
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}

          {canModerate && (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}

          {isProfileOwner && comment.is_question && !comment.is_answered && (
            <button
              onClick={() => onMarkAsAnswered(comment.id)}
              className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark as Answered</span>
            </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-2"
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            {showReplies && (
              <div className="space-y-4">
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
    </div>
  );
}

