'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { STAGE_TYPES } from '@/lib/stageTypes';
import type { Stage, StageCreate, StageUpdate } from '@/types';

interface StageFormProps {
  processId: number;
  stage?: Stage | null;
  onSubmit: (data: StageCreate | StageUpdate) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function StageForm({ processId, stage, onSubmit, onCancel, loading }: StageFormProps) {
  // Get today's date in YYYY-MM-DD format for default
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [stageName, setStageName] = useState('');
  const [customStageName, setCustomStageName] = useState('');
  const [stageDate, setStageDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');
  const [order, setOrder] = useState<number | ''>('');

  useEffect(() => {
    if (stage) {
      // Check if stage name is in predefined types
      const isPredefined = STAGE_TYPES.some(st => st.value === stage.stage_name);
      if (isPredefined) {
        setStageName(stage.stage_name);
        setCustomStageName('');
      } else {
        setStageName('Other');
        setCustomStageName(stage.stage_name);
      }
      setStageDate(stage.stage_date.split('T')[0]); // Extract date part from ISO string
      setNotes(stage.notes || '');
      setOrder(stage.order);
    }
  }, [stage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use custom name if "Other" is selected, otherwise use selected stage name
    const finalStageName = stageName === 'Other' ? customStageName : stageName;
    
    if (stageName === 'Other' && !customStageName.trim()) {
      // Don't submit if Other is selected but no custom name provided
      return;
    }
    
    const data: StageCreate | StageUpdate = {
      stage_name: finalStageName,
      stage_date: stageDate,
      notes: notes || null,
    };

    if (stage) {
      // Update
      onSubmit(data as StageUpdate);
    } else {
      // Create
      (data as StageCreate).process_id = processId;
      if (order !== '') {
        (data as StageCreate).order = Number(order);
      }
      onSubmit(data as StageCreate);
    }
  };

  const selectOptions = STAGE_TYPES.map(st => ({
    value: st.value,
    label: st.label,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Stage Type"
        value={stageName}
        onChange={(e) => {
          setStageName(e.target.value);
          if (e.target.value !== 'Other') {
            setCustomStageName('');
          }
        }}
        required
        options={selectOptions}
        placeholder={!stage ? "Select a stage type..." : undefined}
      />
      
      {stageName === 'Other' && (
        <Input
          label="Custom Stage Name"
          value={customStageName}
          onChange={(e) => setCustomStageName(e.target.value)}
          required
          placeholder="Enter custom stage name"
        />
      )}

      <Input
        label="Date"
        type="date"
        value={stageDate}
        onChange={(e) => setStageDate(e.target.value)}
        required
      />

      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Additional notes about this stage"
      />

      {!stage && (
        <Input
          label="Order (optional)"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="Leave empty for auto-ordering"
          min="1"
        />
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : stage ? 'Update Stage' : 'Create Stage'}
        </Button>
      </div>
    </form>
  );
}

