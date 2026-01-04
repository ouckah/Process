'use client';

import React, { useState } from 'react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useProfileComments, useCreateComment, useDeleteComment, useReplyToComment, useMarkAsAnswered, useUpdateComment, useUpvoteComment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProfileComment } from '@/types';

interface ProfileCommentsProps {
  username: string;
  commentsEnabled: boolean;
  isProfileOwner: boolean;
}

export function ProfileComments({ username, commentsEnabled, isProfileOwner }: ProfileCommentsProps) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useProfileComments(username);
  const createComment = useCreateComment(username);
  const deleteComment = useDeleteComment(username);
  const replyToComment = useReplyToComment(username);
  const markAsAnswered = useMarkAsAnswered(username);
  const updateComment = useUpdateComment(username);
  const upvoteComment = useUpvoteComment(username);

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<ProfileComment | null>(null);
  const [filter, setFilter] = useState<'all' | 'comments' | 'questions'>('all');

  const handleCreateComment = async (data: { content: string; is_question: boolean; author_display_name?: string | null }) => {
    try {
      await createComment.mutateAsync(data);
      setShowCommentForm(false);
      setShowQuestionForm(false);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleReply = async (data: { content: string; is_question: boolean; author_display_name?: string | null }) => {
    if (!replyingTo) return;
    try {
      await replyToComment.mutateAsync({ commentId: replyingTo, data });
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleMarkAsAnswered = async (commentId: number) => {
    try {
      await markAsAnswered.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to mark as answered:', error);
    }
  };

  const handleEdit = (comment: ProfileComment) => {
    setEditingComment(comment);
  };

  const handleUpdateComment = async (data: { content: string; is_question: boolean; author_display_name?: string | null }) => {
    if (!editingComment) return;
    try {
      await updateComment.mutateAsync({ commentId: editingComment.id, data: { content: data.content } });
      setEditingComment(null);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  if (!commentsEnabled) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Comments are disabled for this profile.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    );
  }

  const topLevelComments = comments || [];

  // Filter comments based on selected filter
  const filteredComments = topLevelComments.filter(comment => {
    if (filter === 'comments') return !comment.is_question;
    if (filter === 'questions') return comment.is_question;
    return true; // 'all'
  });

  const handleUpvote = async (commentId: number) => {
    try {
      await upvoteComment.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to upvote comment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Comments & Questions
            </h2>
            {user && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowQuestionForm(true);
                    setShowCommentForm(false);
                  }}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Ask Question
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowCommentForm(true);
                    setShowQuestionForm(false);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex items-center space-x-2 mt-4 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'all'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('comments')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'comments'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setFilter('questions')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'questions'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Questions
            </button>
          </div>
        </div>

        {!user && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Sign in required:</strong> Please{' '}
              <a href="/login" className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-200">
                log in
              </a>
              {' '}to post comments or ask questions.
            </p>
          </div>
        )}

        {showCommentForm && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <CommentForm
              onSubmit={handleCreateComment}
              onCancel={() => setShowCommentForm(false)}
              loading={createComment.isPending}
            />
          </div>
        )}

        {showQuestionForm && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <CommentForm
              onSubmit={handleCreateComment}
              onCancel={() => setShowQuestionForm(false)}
              isQuestion
              loading={createComment.isPending}
            />
          </div>
        )}

        {filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all' 
                ? (user ? 'Be the first to ask a question or leave a comment!' : 'No comments or questions yet.')
                : filter === 'comments'
                ? (user ? 'Be the first to leave a comment!' : 'No comments yet.')
                : (user ? 'Be the first to ask a question!' : 'No questions yet.')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id}>
                {editingComment && editingComment.id === comment.id ? (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <CommentForm
                      onSubmit={handleUpdateComment}
                      onCancel={() => setEditingComment(null)}
                      loading={updateComment.isPending}
                      initialContent={editingComment.content}
                    />
                  </div>
                ) : (
                  <>
                    <CommentItem
                      comment={comment}
                      username={username}
                      isProfileOwner={isProfileOwner}
                      onReply={(commentId) => setReplyingTo(commentId)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMarkAsAnswered={handleMarkAsAnswered}
                      onUpvote={handleUpvote}
                    />
                    {replyingTo === comment.id && (
                      <div className="ml-6 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <CommentForm
                          onSubmit={handleReply}
                          onCancel={() => setReplyingTo(null)}
                          loading={replyToComment.isPending}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

