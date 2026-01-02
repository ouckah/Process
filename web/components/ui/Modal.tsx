'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md', // 28rem / 448px
    md: 'max-w-lg', // 32rem / 512px
    lg: 'max-w-2xl', // 42rem / 672px
    xl: 'max-w-4xl', // 56rem / 896px
  };

  const maxWidthPx = {
    sm: '448px',
    md: '512px',
    lg: '672px',
    xl: '896px',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div
          className={cn(
            'inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle',
            'w-[calc(100%-2rem)]'
          )}
          style={{ 
            maxWidth: maxWidthPx[size],
            width: 'calc(100% - 2rem)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none flex-shrink-0 ml-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Content */}
          <div 
            className="px-6 py-4 text-gray-900 dark:text-gray-100" 
            style={{ 
              overflow: 'hidden', 
              minWidth: 0, 
              maxWidth: '100%', 
              width: '100%',
              boxSizing: 'border-box',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

