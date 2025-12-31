'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitFeedback } from '@/hooks/useFeedback';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle } from 'lucide-react';
import type { FeedbackCreate } from '@/types';

export function FeedbackForm() {
  const { isAuthenticated, user } = useAuth();
  const submitFeedback = useSubmitFeedback();
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    if (!isAuthenticated) {
      if (!name.trim() || !email.trim()) {
        setError('Name and email are required');
        return;
      }
    }

    const feedbackData: FeedbackCreate = {
      message: message.trim(),
      ...(isAuthenticated ? {} : { name: name.trim(), email: email.trim() }),
    };

    try {
      await submitFeedback.mutateAsync(feedbackData);
      setSubmitted(true);
      setMessage('');
      setName('');
      setEmail('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to submit feedback. Please try again.';
      setError(errorMessage);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium">Thank you for your feedback!</p>
        </div>
        <p className="mt-2 text-sm">We appreciate you taking the time to share your thoughts with us.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setSubmitted(false)}
        >
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isAuthenticated ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="text-sm">Submitting as <strong>{user?.username}</strong></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your.email@example.com"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          placeholder="Share your feedback, suggestions, or report any issues..."
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitFeedback.isPending}>
          {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </div>
    </form>
  );
}

