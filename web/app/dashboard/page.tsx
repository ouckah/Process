'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProcesses } from '@/hooks/useProcesses';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProcessList } from '@/components/processes/ProcessList';
import { ProcessAnalytics } from '@/components/analytics/ProcessAnalytics';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { ExportButton } from '@/components/processes/ExportButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Plus, Loader2, BarChart3, List } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: processes, isLoading: processesLoading } = useProcesses();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      action: () => router.push('/processes/new'),
      description: 'Create new process',
    },
    {
      key: '?',
      action: () => setShowShortcutsModal(true),
      description: 'Show keyboard shortcuts',
    },
    {
      key: 'a',
      action: () => setViewMode('analytics'),
      description: 'Switch to analytics view',
    },
    {
      key: 'l',
      action: () => setViewMode('list'),
      description: 'Switch to list view',
    },
  ], isAuthenticated);

  const shortcuts = [
    { key: 'n', description: 'Create new process' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'a', description: 'Switch to analytics view' },
    { key: 'l', description: 'Switch to list view' },
  ];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activeCount = processes?.filter(p => p.status === 'active').length || 0;
  const completedCount = processes?.filter(p => p.status === 'completed').length || 0;
  const rejectedCount = processes?.filter(p => p.status === 'rejected').length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.username}!</p>
            </div>
            {processes && processes.length > 0 && (
              <div className="flex gap-2">
                <ExportButton />
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'analytics' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('analytics')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats - Only show if user has processes and NOT in analytics view (analytics has its own metrics) */}
        {processes && processes.length > 0 && viewMode !== 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{processes.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Processes</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
            </div>
          </div>
        )}

        {/* Processes or First-Time Empty State */}
        {processes && processes.length === 0 && !processesLoading ? (
          <EmptyState type="first-time" />
        ) : viewMode === 'analytics' ? (
          <ProcessAnalytics />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProcessList />
            </div>
            <div className="lg:col-span-1">
              <ActivityFeed processes={processes || []} />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}

