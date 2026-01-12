'use client';

import React, { useState, useRef, useEffect } from 'react';
import DatePickerLib from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export function DatePicker({ 
  label, 
  value, 
  onChange, 
  error, 
  required, 
  className 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse YYYY-MM-DD to Date object in local timezone
  const parseDateString = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Convert YYYY-MM-DD to Date object (local timezone)
  const dateValue = value ? parseDateString(value) : new Date();
  
  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Format to YYYY-MM-DD using local timezone methods
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setIsOpen(false);
    }
  };

  // Format for display using local timezone
  const displayValue = value ? (() => {
    const date = parseDateString(value);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  })() : '';

  return (
    <div ref={containerRef} className={cn('w-full relative', className)}>
      {label && (
        <div className="mb-3">
          <div className="inline-block bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
            <label className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
              {label} {required && '*'}
            </label>
          </div>
        </div>
      )}
      
      <div className="relative">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative w-full px-4 py-3 border-4 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 font-bold focus:outline-none focus:bg-cream-100 dark:focus:bg-ink-800 transition-colors flex items-center justify-between',
            error && 'border-red-600 dark:border-red-500'
          )}
        >
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-ink-600 dark:text-ink-400" />
            <span>{displayValue || 'Select date'}</span>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 z-50"
              style={{ width: 'calc(100% - 2px)' }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 -z-10"></div>
                <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1 brutalist-datepicker">
                  <DatePickerLib
                    selected={dateValue}
                    onChange={handleDateChange}
                    dateFormat="MMMM d, yyyy"
                    inline
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-2 relative group">
          <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-1 translate-y-1"></div>
          <div className="relative bg-red-600 dark:bg-red-500 border-2 border-ink-900 dark:border-cream-50 p-3 transform rotate-1">
            <p className="font-body text-sm font-black uppercase tracking-wider text-white">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
