'use client';

import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Eye, Edit } from 'lucide-react';

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
}

export function MarkdownTextarea({ value, onChange, label, placeholder, rows = 4, disabled = false, maxLength }: MarkdownTextareaProps) {
  const [isPreview, setIsPreview] = useState(false);

  const renderMarkdown = (text: string): string => {
    // Simple markdown rendering
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br />');

    return html;
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        <div className="flex justify-end border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
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
        </div>
        {isPreview ? (
          <div
            className="p-3 min-h-[100px] prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100"
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
            className="w-full p-3 border-0 focus:outline-none focus:ring-0 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Supports Markdown: **bold**, *italic*, [links](url), # headers
      </p>
    </div>
  );
}

