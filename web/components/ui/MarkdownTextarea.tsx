'use client';

import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Eye, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { renderMarkdown } from '@/lib/utils';

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export function MarkdownTextarea({ value, onChange, label, placeholder, rows = 4, disabled = false, maxLength, className }: MarkdownTextareaProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className={`w-full ${className || ''}`}>
      {label && (
        <label className="block text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
        <div className="relative border-4 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-900">
          <div className="flex justify-end border-b-4 border-ink-900 dark:border-cream-50 bg-ink-900 dark:bg-cream-50 p-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className="border-2 border-cream-50 dark:border-ink-900 bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 font-black uppercase tracking-wider"
              >
                {isPreview ? (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            </motion.div>
          </div>
          {isPreview ? (
            <div
              className="p-4 min-h-[100px] prose prose-sm dark:prose-invert max-w-none text-ink-900 dark:text-cream-100 font-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value || '') }}
            />
          ) : (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'Enter notes (Markdown supported)'}
              rows={rows}
              disabled={disabled}
              maxLength={maxLength}
              className="w-full p-4 border-0 focus:outline-none focus:ring-0 resize-none bg-cream-50 dark:bg-ink-900 text-ink-900 dark:text-cream-50 placeholder-ink-500 dark:placeholder-ink-500 disabled:opacity-50 disabled:cursor-not-allowed font-body"
            />
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start">
        <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-[0.5deg]">
          <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
            Supports Markdown: **bold**, *italic*, [links](url), # headers
          </p>
        </div>
      </div>
    </div>
  );
}
