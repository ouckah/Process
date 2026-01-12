'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageSquare, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MarkdownTextarea } from '@/components/ui/MarkdownTextarea';
import { motion } from 'framer-motion';

interface CommentFormProps {
  onSubmit: (data: { content: string; is_question: boolean; author_display_name?: string | null }) => void;
  onCancel?: () => void;
  isQuestion?: boolean;
  placeholder?: string;
  loading?: boolean;
  initialContent?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  isQuestion = false,
  placeholder,
  loading = false,
  initialContent = '',
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [anonymousDisplayName, setAnonymousDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Comment content cannot be empty');
      return;
    }

    if (postAnonymously && !anonymousDisplayName.trim()) {
      setError('Display name is required for anonymous comments');
      return;
    }

    onSubmit({
      content: content.trim(),
      is_question: isQuestion,
      author_display_name: postAnonymously ? anonymousDisplayName.trim() : null,
    });

    // Reset form
    setContent('');
    setPostAnonymously(false);
    setAnonymousDisplayName('');
  };

  const canPostAnonymously = user?.is_anonymous || false;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="relative group">
          <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-1 translate-y-1"></div>
          <div className="relative bg-red-600 dark:bg-red-500 border-2 border-ink-900 dark:border-cream-50 p-4 transform rotate-1">
            <p className="font-body text-sm font-black uppercase tracking-wider text-white">{error}</p>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3">
          <div className="inline-block bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
            <label className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
              {isQuestion ? 'Your Question' : 'Your Comment'}
            </label>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
          <MarkdownTextarea
            value={content}
            onChange={(value) => setContent(value)}
            placeholder={placeholder || (isQuestion ? 'Ask a question...' : 'Write a comment...')}
            rows={6}
            className="relative border-4 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 font-bold focus:outline-none focus:bg-cream-100 dark:focus:bg-ink-800 transition-colors"
          />
        </div>
        <div className="mt-2 bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
          <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
            {content.length}/2000 characters
          </p>
        </div>
      </div>

      {canPostAnonymously && (
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
              <input
                type="checkbox"
                checked={postAnonymously}
                onChange={(e) => setPostAnonymously(e.target.checked)}
                disabled={loading}
                className="relative w-5 h-5 border-2 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-indigo-600 focus:ring-2 focus:ring-indigo-600 cursor-pointer"
              />
            </div>
            <span className="font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">Post anonymously</span>
          </label>
          {postAnonymously && (
            <Input
              value={anonymousDisplayName}
              onChange={(e) => setAnonymousDisplayName(e.target.value)}
              placeholder="Enter a display name"
              maxLength={100}
              disabled={loading}
            />
          )}
        </div>
      )}

      <div className="flex items-center space-x-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            type="submit" 
            disabled={loading || !content.trim()}
            className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
          >
            {loading ? 'Posting...' : (isQuestion ? 'Ask Question' : 'Post Comment')}
          </Button>
        </motion.div>
        {onCancel && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={loading}
              className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </div>
    </form>
  );
}
