'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageSquare, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MarkdownTextarea } from '@/components/ui/MarkdownTextarea';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {isQuestion ? 'Your Question' : 'Your Comment'}
        </label>
        <MarkdownTextarea
          value={content}
          onChange={(value) => setContent(value)}
          placeholder={placeholder || (isQuestion ? 'Ask a question...' : 'Write a comment...')}
          rows={4}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {content.length}/2000 characters
        </p>
      </div>

      {canPostAnonymously && (
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={postAnonymously}
              onChange={(e) => setPostAnonymously(e.target.checked)}
              disabled={loading}
              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Post anonymously</span>
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

      <div className="flex items-center space-x-2">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? 'Posting...' : (isQuestion ? 'Ask Question' : 'Post Comment')}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

