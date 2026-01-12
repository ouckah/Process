import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-600 dark:text-ink-400 z-10">
              {icon}
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
            <input
              ref={ref}
              className={cn(
                'relative w-full px-4 py-3 border-4 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 placeholder-ink-500 dark:placeholder-ink-500 font-bold focus:outline-none focus:bg-cream-100 dark:focus:bg-ink-800 transition-colors',
                error && 'border-red-600 dark:border-red-500',
                icon && 'pl-12',
                className
              )}
              {...props}
            />
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
