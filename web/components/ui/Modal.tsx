'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const maxWidthPx = {
    sm: '448px',
    md: '512px',
    lg: '672px',
    xl: '896px',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-cream-50/60 dark:bg-ink-950/60 backdrop-blur-md"
              onClick={onClose}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'relative inline-block align-bottom bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 text-left sm:my-8 sm:align-middle',
                'w-[calc(100%-2rem)] transform rotate-1',
                sizes[size]
              )}
              style={{ 
                maxWidth: maxWidthPx[size],
                width: 'calc(100% - 2rem)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 10
              }}
            >
              {/* Shadow */}
              <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 -z-10"></div>

              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b-4 border-ink-900 dark:border-cream-50 bg-ink-900 dark:bg-cream-50">
                  <div className="bg-cream-50 dark:bg-ink-900 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
                    <h3 className="font-display text-lg font-black uppercase tracking-tight text-ink-900 dark:text-cream-50">{title}</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="bg-red-600 dark:bg-red-500 w-8 h-8 border-2 border-ink-900 dark:border-cream-50 flex items-center justify-center flex-shrink-0 transform rotate-1"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              )}

              {/* Content */}
              <div 
                className="px-6 py-4 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 max-h-[calc(100vh-200px)] overflow-y-auto" 
                style={{ 
                  overflowX: 'hidden',
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
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
