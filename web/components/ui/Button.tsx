import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-wider transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 border-2 border-ink-900 dark:border-cream-50',
    secondary: 'bg-ink-200 dark:bg-ink-700 text-ink-900 dark:text-ink-100 hover:bg-ink-300 dark:hover:bg-ink-600 border-2 border-ink-900 dark:border-cream-50',
    danger: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 border-2 border-ink-900 dark:border-cream-50',
    outline: 'border-2 border-ink-900 dark:border-cream-50 text-ink-900 dark:text-cream-50 bg-cream-50 dark:bg-ink-900 hover:bg-ink-100 dark:hover:bg-ink-800',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

