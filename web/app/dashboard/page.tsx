'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProcesses } from '@/hooks/useProcesses';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProcessList } from '@/components/processes/ProcessList';
import { ProcessAnalytics } from '@/components/analytics/ProcessAnalytics';
import { ExportButton } from '@/components/processes/ExportButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Loader2, BarChart3, List, Plus } from 'lucide-react';
import Link from 'next/link';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { motion } from 'framer-motion';

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
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activeCount = processes?.filter(p => p.status === 'active').length || 0;
  const completedCount = processes?.filter(p => p.status === 'completed').length || 0;
  const rejectedCount = processes?.filter(p => p.status === 'rejected').length || 0;
  const totalCount = processes?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Brutalist Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-4">
                <p className="font-body text-xs uppercase tracking-[0.3em] font-black text-cream-50 dark:text-ink-900">
                  Dashboard
                </p>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black text-ink-900 dark:text-cream-50 leading-tight tracking-tighter mb-2">
                WELCOME BACK
              </h1>
              <p className="font-body text-xl text-ink-700 dark:text-ink-300 font-bold">
                {user?.username?.toUpperCase() || 'USER'}
              </p>
            </div>
            
            {processes && processes.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <ExportButton />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="font-black uppercase tracking-wider border-2 border-ink-900 dark:border-cream-50"
                  >
                    <List className="w-4 h-4 mr-2" />
                    List
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={viewMode === 'analytics' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('analytics')}
                    className="font-black uppercase tracking-wider border-2 border-ink-900 dark:border-cream-50"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Brutalist Stats Cards - Only show if user has processes and NOT in analytics view */}
        {processes && processes.length > 0 && viewMode !== 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {[
              { label: 'TOTAL', value: totalCount, color: 'indigo', bg: 'bg-indigo-600 dark:bg-indigo-500', text: 'text-white' },
              { label: 'ACTIVE', value: activeCount, color: 'blue', bg: 'bg-blue-600 dark:bg-blue-500', text: 'text-white' },
              { label: 'DONE', value: completedCount, color: 'green', bg: 'bg-green-600 dark:bg-green-500', text: 'text-white' },
              { label: 'REJECTED', value: rejectedCount, color: 'red', bg: 'bg-red-600 dark:bg-red-500', text: 'text-white' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
                <div className={`relative ${stat.bg} border-4 border-ink-900 dark:border-cream-50 p-6 transform ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'} group-hover:rotate-0 transition-transform`}>
                  <div className={`text-4xl font-black ${stat.text} mb-2`}>
                    {stat.value}
                  </div>
                  <div className={`text-xs uppercase tracking-widest font-black ${stat.text} opacity-90`}>
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Quick Action - Brutalist Button */}
        {processes && processes.length > 0 && viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Link href="/processes/new">
              <motion.div
                whileHover={{ scale: 1.05, x: 4, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block relative group"
              >
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
                <Button 
                  className="relative bg-amber-500 dark:bg-amber-400 hover:bg-amber-600 dark:hover:bg-amber-500 text-ink-900 px-8 py-4 text-lg font-black uppercase tracking-wider border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 group-hover:rotate-0 transition-all"
                >
                  <Plus className="w-5 h-5 mr-2 inline" />
                  NEW PROCESS
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* Processes or First-Time Empty State */}
        {processes && processes.length === 0 && !processesLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <EmptyState type="first-time" />
          </motion.div>
        ) : viewMode === 'analytics' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProcessAnalytics />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProcessList />
          </motion.div>
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
