import React from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, className, options, placeholder, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
        <select
          className={cn(
            'relative w-full px-4 py-3 border-4 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 font-bold focus:outline-none focus:bg-cream-100 dark:focus:bg-ink-800 transition-colors appearance-none cursor-pointer',
            error && 'border-red-600 dark:border-red-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom arrow */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-ink-900 dark:border-t-cream-50"></div>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider">{error}</p>
      )}
    </div>
  );
}
