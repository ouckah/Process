'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProcesses } from '@/hooks/useProcesses';
import { Button } from '@/components/ui/Button';
import { Download, FileText, FileJson, Printer } from 'lucide-react';
import { exportProcessesToCSV, exportProcessesToJSON } from '@/lib/export';
import { processApi } from '@/lib/api';
import { motion } from 'framer-motion';
import type { ProcessDetail } from '@/types';

export function ExportButton() {
  const { data: processes } = useProcesses();
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = async (format: 'csv' | 'json' | 'print') => {
    if (!processes || processes.length === 0) return;

    if (format === 'print') {
      window.print();
      setIsOpen(false);
      return;
    }

    setIsExporting(true);
    try {
      // Fetch full process details with stages
      const processDetails: ProcessDetail[] = await Promise.all(
        processes.map(process => processApi.getDetail(process.id))
      );

      if (format === 'csv') {
        exportProcessesToCSV(processDetails);
      } else {
        exportProcessesToJSON(processDetails);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export processes. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!processes || processes.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting}
          className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </motion.div>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-3 w-56 z-50"
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 py-2 transform rotate-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-3 text-sm font-bold text-ink-900 dark:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 uppercase tracking-wider flex items-center gap-3 transition-colors"
            >
              <div className="bg-indigo-600 dark:bg-indigo-500 w-6 h-6 border border-ink-900 dark:border-cream-50 flex items-center justify-center">
                <FileText className="w-3 h-3 text-white" />
              </div>
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left px-4 py-3 text-sm font-bold text-ink-900 dark:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 uppercase tracking-wider flex items-center gap-3 transition-colors"
            >
              <div className="bg-indigo-600 dark:bg-indigo-500 w-6 h-6 border border-ink-900 dark:border-cream-50 flex items-center justify-center">
                <FileJson className="w-3 h-3 text-white" />
              </div>
              Export as JSON
            </button>
            <button
              onClick={() => handleExport('print')}
              className="w-full text-left px-4 py-3 text-sm font-bold text-ink-900 dark:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 uppercase tracking-wider flex items-center gap-3 transition-colors"
            >
              <div className="bg-indigo-600 dark:bg-indigo-500 w-6 h-6 border border-ink-900 dark:border-cream-50 flex items-center justify-center">
                <Printer className="w-3 h-3 text-white" />
              </div>
              Print View
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

