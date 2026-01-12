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
import { motion } from 'framer-motion';
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
  const [prefilledQuestion, setPrefilledQuestion] = useState<string>('');
  const hasScrolledRef = React.useRef(false);

  // Check URL params on mount to open question form and scroll
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !hasScrolledRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const askParam = urlParams.get('ask');
      const questionParam = urlParams.get('question');
      
      if (askParam === 'true' || askParam === '1') {
        hasScrolledRef.current = true;
        
        // Only open form if user is logged in
        if (user) {
          setShowQuestionForm(true);
          setShowCommentForm(false);
          if (questionParam) {
            setPrefilledQuestion(decodeURIComponent(questionParam));
          }
        }
        
        // Wait for component to be fully rendered, then scroll once
        const performScroll = () => {
          const commentsSection = document.getElementById('profile-comments');
          if (commentsSection) {
            // Use scrollIntoView for better browser compatibility
            commentsSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
            
            // If user is logged in and form should be visible, scroll to form after it renders
            if (user) {
              setTimeout(() => {
                const questionForm = document.getElementById('question-form');
                if (questionForm) {
                  questionForm.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                  });
                }
              }, 800);
            }
            return true;
          }
          return false;
        };
        
        // Wait a bit for the page to settle, then scroll
        setTimeout(() => {
          if (!performScroll()) {
            // Retry once if element not found
            setTimeout(performScroll, 500);
          }
        }, 400);
      }
    }
  }, [user]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<ProfileComment | null>(null);
  const [filter, setFilter] = useState<'all' | 'comments' | 'questions'>('all');

  const handleCreateComment = async (data: { content: string; is_question: boolean; author_display_name?: string | null }) => {
    try {
      await createComment.mutateAsync(data);
      setShowCommentForm(false);
      setShowQuestionForm(false);
      setPrefilledQuestion('');
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
      <div className="relative group">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 text-center transform rotate-1">
          <p className="font-body text-ink-700 dark:text-ink-300 font-bold uppercase tracking-wider">
            Comments are disabled for this profile
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 flex items-center justify-center transform -rotate-1">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
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
    <motion.div
      id="profile-comments"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
      <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform rotate-1 group-hover:rotate-0 transition-transform">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Comments & Questions
              </h2>
            </div>
            {user && (
              <div className="flex items-center space-x-3 flex-shrink-0">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowQuestionForm(true);
                      setShowCommentForm(false);
                    }}
                    className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Ask Question
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowCommentForm(true);
                      setShowQuestionForm(false);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </motion.div>
              </div>
            )}
          </div>

          {/* Filter buttons - Brutalist */}
          <div className="flex items-center space-x-3 mb-6">
            {(['all', 'comments', 'questions'] as const).map((filterOption) => (
              <motion.button
                key={filterOption}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(filterOption)}
                className={`relative group ${
                  filter === filterOption
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                    : 'bg-cream-100 dark:bg-ink-800 text-ink-900 dark:text-cream-50'
                } px-4 py-2 border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider text-sm transform ${filter === filterOption ? 'rotate-0' : 'rotate-1'} hover:rotate-0 transition-transform`}
              >
                {filterOption === 'all' ? 'All' : filterOption === 'comments' ? 'Comments' : 'Questions'}
              </motion.button>
            ))}
          </div>
        </div>

        {!user && (
          <div className="mb-6 relative group">
            <div className="absolute inset-0 bg-amber-500 dark:bg-amber-400 translate-x-1 translate-y-1"></div>
            <div className="relative bg-amber-500 dark:bg-amber-400 border-2 border-ink-900 dark:border-cream-50 p-4 transform -rotate-1">
              <p className="font-body text-sm font-black uppercase tracking-wider text-ink-900">
                <strong>Sign in required:</strong> Please{' '}
                <a href="/login" className="underline hover:text-ink-700">
                  log in
                </a>
                {' '}to post comments or ask questions.
              </p>
            </div>
          </div>
        )}

        {showCommentForm && user && (
          <div className="mb-6 pb-6 border-b-4 border-ink-900 dark:border-cream-50">
            <CommentForm
              onSubmit={handleCreateComment}
              onCancel={() => setShowCommentForm(false)}
              loading={createComment.isPending}
            />
          </div>
        )}

        {showQuestionForm && user && (
          <div id="question-form" className="mb-6 pb-6 border-b-4 border-ink-900 dark:border-cream-50">
            <CommentForm
              onSubmit={handleCreateComment}
              onCancel={() => {
                setShowQuestionForm(false);
                setPrefilledQuestion('');
              }}
              isQuestion
              loading={createComment.isPending}
              initialContent={prefilledQuestion}
            />
          </div>
        )}

        {filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block bg-ink-900 dark:bg-cream-50 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform rotate-1">
              <p className="font-body text-cream-50 dark:text-ink-900 font-bold uppercase tracking-wider">
                {filter === 'all' 
                  ? (user ? 'Be the first to ask a question or leave a comment!' : 'No comments or questions yet.')
                  : filter === 'comments'
                  ? (user ? 'Be the first to leave a comment!' : 'No comments yet.')
                  : (user ? 'Be the first to ask a question!' : 'No questions yet.')
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredComments.map((comment, idx) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                {editingComment && editingComment.id === comment.id ? (
                  <div className="mb-4 relative group">
                    <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                    <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
                      <CommentForm
                        onSubmit={handleUpdateComment}
                        onCancel={() => setEditingComment(null)}
                        loading={updateComment.isPending}
                        initialContent={editingComment.content}
                      />
                    </div>
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
                      <div className="ml-6 mt-4 relative group">
                        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                        <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
                          <CommentForm
                            onSubmit={handleReply}
                            onCancel={() => setReplyingTo(null)}
                            loading={replyToComment.isPending}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
