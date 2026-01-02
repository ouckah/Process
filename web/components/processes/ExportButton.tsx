'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProcesses } from '@/hooks/useProcesses';
import { Button } from '@/components/ui/Button';
import { Download, FileText, FileJson, Printer } from 'lucide-react';
import { exportProcessesToCSV, exportProcessesToJSON } from '@/lib/export';
import { processApi } from '@/lib/api';
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
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <button
            onClick={() => handleExport('csv')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            Export as JSON
          </button>
          <button
            onClick={() => handleExport('print')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print View
          </button>
        </div>
      )}
    </div>
  );
}

