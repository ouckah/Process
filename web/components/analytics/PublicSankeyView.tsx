'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SankeyChart } from './SankeyChart';
import { Button } from '@/components/ui/Button';
import { Download, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { analyticsApi, type PublicAnalyticsResponse } from '@/lib/api';
import type { Process, ProcessDetail } from '@/types';

interface PublicSankeyViewProps {
  analytics: PublicAnalyticsResponse;
  isOwnPage: boolean;
}

export function PublicSankeyView({ analytics, isOwnPage }: PublicSankeyViewProps) {
  const router = useRouter();
  const username = analytics.username;

  const handleSaveImage = async () => {
    try {
      // Use html2canvas to capture the Sankey chart
      const html2canvas = (await import('html2canvas')).default;
      const chartElement = document.querySelector('[data-sankey-chart]');
      
      if (!chartElement) {
        alert('Chart not found. Please try again.');
        return;
      }
      
      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: null,
        scale: 2,
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate image.');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sankey-${username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Failed to save image:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  const displayName = analytics.is_anonymous 
    ? (analytics.display_name || 'Anonymous User')
    : analytics.username;

  // Convert process_details to ProcessDetail[] format
  const processDetails: ProcessDetail[] = analytics.process_details.map((detail) => ({
    id: detail.id,
    company_name: detail.company_name,
    position: detail.position,
    status: detail.status,
    is_public: detail.is_public,
    share_id: detail.share_id,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    stages: detail.stages || [],
  }));

  return (
    <div className="space-y-8">
      {/* Header - Brutalist */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div>
          <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-4">
            <p className="font-body text-xs uppercase tracking-[0.3em] font-black text-cream-50 dark:text-ink-900">
              Sankey Diagram
            </p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight mb-2">
            {displayName.toUpperCase()}
          </h1>
          <p className="font-body text-lg text-ink-700 dark:text-ink-300 font-bold">
            {analytics.stats.total_public_processes} public process{analytics.stats.total_public_processes !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isOwnPage && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </motion.div>
          )}
          <Link href={`/profile/${username}`}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </motion.div>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              onClick={handleSaveImage}
              className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Image
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Sankey Chart - Wider */}
      {analytics.processes.length > 0 && processDetails.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative group w-full"
          data-sankey-chart
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1 group-hover:rotate-0 transition-transform">
            <div className="mb-6">
              <div className="inline-block bg-purple-600 dark:bg-purple-500 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mb-3">
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">Stage Flow</h3>
              </div>
            </div>
            <div className="w-full h-[600px] bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-8">
              <SankeyChart 
                processes={analytics.processes} 
                processDetails={processDetails}
                largeText={true}
              />
            </div>
            <div className="mt-4 bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
              <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                Wider flows = more transitions
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="relative group">
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 text-center transform rotate-1">
            <p className="font-body text-lg font-black uppercase tracking-wider text-ink-700 dark:text-ink-300">
              No public processes available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
