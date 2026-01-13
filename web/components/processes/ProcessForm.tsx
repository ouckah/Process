'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MarkdownTextarea } from '@/components/ui/MarkdownTextarea';
import type { Process, ProcessCreate, ProcessUpdate } from '@/types';

interface ProcessFormProps {
  process?: Process | null;
  onSubmit: (data: ProcessCreate | ProcessUpdate) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ProcessForm({ process, onSubmit, onCancel, loading, error }: ProcessFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (process) {
      setCompanyName(process.company_name);
      setPosition(process.position || '');
      setDescription(process.description || '');
    }
  }, [process]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Status is automatically calculated from stages, so we don't include it
    const data: ProcessCreate | ProcessUpdate = {
      company_name: companyName,
      position: position || null,
      description: description.trim() || null,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {error && (
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded"
          style={{ 
            wordBreak: 'break-word', 
            overflowWrap: 'break-word', 
            width: '100%', 
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <p className="text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{error}</p>
        </div>
      )}

      <Input
        label="Company Name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
        placeholder="e.g., Google, Microsoft"
      />

      <Input
        label="Position (optional)"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        placeholder="e.g., Software Engineer, Product Manager"
      />

      <div>
        <label className="block mb-2 font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
          Description (optional, but encouraged)
        </label>
        <MarkdownTextarea
          value={description}
          onChange={(value) => setDescription(value)}
          placeholder="Describe the process, what kind of questions were asked, interview format, etc. This helps others learn from your experience!"
          rows={6}
        />
        <p className="mt-2 text-xs text-ink-600 dark:text-ink-400 font-body">
          Share details about the interview process, questions asked, format, and your experience.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : process ? 'Update Process' : 'Create Process'}
        </Button>
      </div>
    </form>
  );
}

