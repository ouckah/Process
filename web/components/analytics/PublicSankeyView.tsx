'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SankeyChart } from './SankeyChart';
import { Button } from '@/components/ui/Button';
import { Download, ArrowLeft } from 'lucide-react';
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
      const imageUrl = analyticsApi.getSankeyImageUrl(username);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sankey-${username}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Analytics - {displayName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stage flow visualization for {analytics.stats.total_public_processes} public process{analytics.stats.total_public_processes !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {isOwnPage && (
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSaveImage}
          >
            <Download className="w-4 h-4 mr-2" />
            Save Image
          </Button>
        </div>
      </div>

      {/* Sankey Chart */}
      {analytics.processes.length > 0 && processDetails.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <SankeyChart 
            processes={analytics.processes} 
            processDetails={processDetails} 
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No public processes available to display.
          </p>
        </div>
      )}
    </div>
  );
}

