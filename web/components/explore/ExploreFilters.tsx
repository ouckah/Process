'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useExploreCompanies, useExploreStages } from '@/hooks/useExplore';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface ExploreFiltersProps {
  search: string;
  company: string;
  stage: string;
  position: string;
  status: string;
  onSearchChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
}

export function ExploreFilters({
  search,
  company,
  stage,
  position,
  status,
  onSearchChange,
  onCompanyChange,
  onStageChange,
  onPositionChange,
  onStatusChange,
  onClear,
}: ExploreFiltersProps) {
  const { data: companies = [] } = useExploreCompanies();
  const { data: stages = [] } = useExploreStages();
  
  const hasFilters = search || company || stage || position || status;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
      <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-5 transform -rotate-1">
        {/* Header */}
        <div className="mb-5">
          <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
              Filters
            </h3>
          </div>
          
          {hasFilters && (
            <button
              onClick={onClear}
              className="flex items-center gap-2 bg-red-600 dark:bg-red-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 hover:rotate-0 transition-transform"
            >
              <X className="w-4 h-4 text-white" />
              <span className="font-body text-xs uppercase tracking-wider font-black text-white">
                Clear All
              </span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search companies, positions, stages..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Company Filter */}
        <div className="mb-4">
          <label className="block font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50 mb-2">
            Company
          </label>
          <Select
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="w-full"
            options={[
              { value: '', label: 'All Companies' },
              ...companies.map((c) => ({ value: c, label: c }))
            ]}
          />
        </div>

        {/* Stage Filter */}
        <div className="mb-4">
          <label className="block font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50 mb-2">
            Stage
          </label>
          <Select
            value={stage}
            onChange={(e) => onStageChange(e.target.value)}
            className="w-full"
            options={[
              { value: '', label: 'All Stages' },
              ...stages.map((s) => ({ value: s, label: s }))
            ]}
          />
        </div>

        {/* Position Filter */}
        <div className="mb-4">
          <label className="block font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50 mb-2">
            Position
          </label>
          <Input
            type="text"
            placeholder="Filter by position..."
            value={position}
            onChange={(e) => onPositionChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50 mb-2">
            Status
          </label>
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>
      </div>
    </motion.div>
  );
}
