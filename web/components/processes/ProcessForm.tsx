'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

  useEffect(() => {
    if (process) {
      setCompanyName(process.company_name);
      setPosition(process.position || '');
    }
  }, [process]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Status is automatically calculated from stages, so we don't include it
    const data: ProcessCreate | ProcessUpdate = {
      company_name: companyName,
      position: position || null,
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

