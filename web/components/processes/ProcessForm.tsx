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
}

export function ProcessForm({ process, onSubmit, onCancel, loading }: ProcessFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'rejected'>('active');

  useEffect(() => {
    if (process) {
      setCompanyName(process.company_name);
      setPosition(process.position || '');
      setStatus(process.status as 'active' | 'completed' | 'rejected');
    }
  }, [process]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: ProcessCreate | ProcessUpdate = {
      company_name: companyName,
      position: position || null,
      status: status,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'rejected')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
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

