'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ExploreFilters } from '@/components/explore/ExploreFilters';
import { ExploreProcessCard } from '@/components/explore/ExploreProcessCard';
import { useExploreProcesses, useExploreStats } from '@/hooks/useExplore';
import { Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [stage, setStage] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: processes, isLoading } = useExploreProcesses({
    search: search || undefined,
    company: company || undefined,
    stage: stage || undefined,
    position: position || undefined,
    status: status || undefined,
    page,
    limit,
  });

  const { data: stats } = useExploreStats();

  const handleClearFilters = () => {
    setSearch('');
    setCompany('');
    setStage('');
    setPosition('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
            <div className="relative bg-ink-900 dark:bg-cream-50 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
              <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900 mb-2">
                Explore Processes
              </h1>
              <p className="font-body text-lg font-bold text-cream-100 dark:text-ink-800">
                Discover and learn from public job application processes
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                <div className="relative bg-indigo-600 dark:bg-indigo-500 border-2 border-ink-900 dark:border-cream-50 p-4 transform -rotate-1">
                  <div className="text-2xl font-black text-white mb-1">{stats.total_processes}</div>
                  <div className="text-xs uppercase tracking-wider font-black text-white opacity-90">
                    Processes
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                <div className="relative bg-amber-600 dark:bg-amber-500 border-2 border-ink-900 dark:border-cream-50 p-4 transform rotate-1">
                  <div className="text-2xl font-black text-white mb-1">{stats.total_companies}</div>
                  <div className="text-xs uppercase tracking-wider font-black text-white opacity-90">
                    Companies
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                <div className="relative bg-green-600 dark:bg-green-500 border-2 border-ink-900 dark:border-cream-50 p-4 transform -rotate-1">
                  <div className="text-2xl font-black text-white mb-1">{stats.total_users}</div>
                  <div className="text-xs uppercase tracking-wider font-black text-white opacity-90">
                    Users
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Link to Forum */}
          <div className="mb-6">
            <Link href="/forum">
              <motion.div
                whileHover={{ scale: 1.05, x: 4, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative group inline-block"
              >
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
                <div className="relative bg-purple-600 dark:bg-purple-500 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 group-hover:rotate-0 transition-transform">
                  <span className="font-body text-sm uppercase tracking-wider font-black text-white">
                    Join Community Discussions →
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ExploreFilters
              search={search}
              company={company}
              stage={stage}
              position={position}
              status={status}
              onSearchChange={setSearch}
              onCompanyChange={setCompany}
              onStageChange={setStage}
              onPositionChange={setPosition}
              onStatusChange={setStatus}
              onClear={handleClearFilters}
            />
          </div>

          {/* Process List */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : !processes || processes.length === 0 ? (
              <EmptyState
                type="first-time"
                title="Be the first!"
                description={
                  search || company || stage || position || status
                    ? "No processes match your filters. Try adjusting your search or filters."
                    : "No public processes yet. Share your first process to help others learn from your experience!"
                }
                actionLabel={search || company || stage || position || status ? "Clear Filters" : undefined}
                onAction={search || company || stage || position || status ? handleClearFilters : undefined}
                hideAction={!search && !company && !stage && !position && !status}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {processes.map((process, index) => (
                    <ExploreProcessCard key={process.id} process={process} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {processes.length === limit && (
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 disabled:opacity-50 disabled:cursor-not-allowed transform rotate-1"
                    >
                      <span className="font-body text-sm uppercase tracking-wider font-black text-cream-50 dark:text-ink-900">
                        Previous
                      </span>
                    </button>
                    <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                      <span className="font-body text-sm uppercase tracking-wider font-black text-cream-50 dark:text-ink-900">
                        Page {page}
                      </span>
                    </div>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1"
                    >
                      <span className="font-body text-sm uppercase tracking-wider font-black text-cream-50 dark:text-ink-900">
                        Next
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
