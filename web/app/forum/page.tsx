'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useForumThreads } from '@/hooks/useForum';
import { useCreateThread } from '@/hooks/useForum';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MarkdownTextarea } from '@/components/ui/MarkdownTextarea';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import type { ForumThread } from '@/types';
import { renderMarkdown } from '@/lib/utils';

export default function ForumPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [company, setCompany] = useState('');
  const [stage, setStage] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('');
  const [newThreadCompany, setNewThreadCompany] = useState('');
  const [newThreadStage, setNewThreadStage] = useState('');
  const [newThreadAuthorName, setNewThreadAuthorName] = useState('');

  const { data: threads, isLoading } = useForumThreads({
    category: category || undefined,
    company: company || undefined,
    stage: stage || undefined,
    sort,
    page,
    limit: 20,
  });

  const createThread = useCreateThread();

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    
    try {
      await createThread.mutateAsync({
        title: newThreadTitle,
        content: newThreadContent,
        category: newThreadCategory || null,
        related_company: newThreadCompany || null,
        related_stage: newThreadStage || null,
        author_display_name: user ? null : (newThreadAuthorName || null),
      });
      setShowCreateModal(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      setNewThreadCategory('');
      setNewThreadCompany('');
      setNewThreadStage('');
      setNewThreadAuthorName('');
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
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
          <div className="flex items-center justify-between mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
              <div className="relative bg-ink-900 dark:bg-cream-50 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
                <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900 mb-2">
                  Community Forum
                </h1>
                <p className="font-body text-lg font-bold text-cream-100 dark:text-ink-800">
                  Discuss experiences, share insights, and connect
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, x: 4, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="relative group"
            >
              <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
              <div className="relative bg-indigo-600 dark:bg-indigo-500 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 group-hover:rotate-0 transition-transform flex items-center gap-2">
                <Plus className="w-5 h-5 text-white" />
                <span className="font-body text-sm uppercase tracking-wider font-black text-white">
                  New Thread
                </span>
              </div>
            </motion.button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-cream-50 dark:bg-ink-900 border-2 border-ink-900 dark:border-cream-50 px-4 py-2 font-body text-sm font-bold"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="company">Company</option>
              <option value="stage">Stage</option>
            </select>
            <input
              type="text"
              placeholder="Filter by company..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-cream-50 dark:bg-ink-900 border-2 border-ink-900 dark:border-cream-50 px-4 py-2 font-body text-sm font-bold"
            />
            <input
              type="text"
              placeholder="Filter by stage..."
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="bg-cream-50 dark:bg-ink-900 border-2 border-ink-900 dark:border-cream-50 px-4 py-2 font-body text-sm font-bold"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-cream-50 dark:bg-ink-900 border-2 border-ink-900 dark:border-cream-50 px-4 py-2 font-body text-sm font-bold"
            >
              <option value="newest">Newest</option>
              <option value="most_replies">Most Replies</option>
              <option value="most_views">Most Views</option>
            </select>
          </div>
        </motion.div>

        {/* Threads List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : !threads || threads.length === 0 ? (
          <EmptyState
            type="first-time"
            title="Be the first!"
            description={
              category || company || stage
                ? "No threads match your filters. Try adjusting your filters or start a new discussion!"
                : "No discussions yet. Be the first to start a conversation and share your experiences!"
            }
            actionLabel="Create Thread"
            onAction={() => setShowCreateModal(true)}
            hideQuickStart={true}
          />
        ) : (
          <div className="space-y-4">
            {threads.map((thread, index) => (
              <ThreadCard key={thread.id} thread={thread} index={index} />
            ))}
          </div>
        )}

        {/* Create Thread Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Thread"
        >
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Thread title..."
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
            />
            <MarkdownTextarea
              value={newThreadContent}
              onChange={(value) => setNewThreadContent(value)}
              placeholder="Thread content..."
              rows={8}
            />
            <Input
              type="text"
              placeholder="Category (optional)"
              value={newThreadCategory}
              onChange={(e) => setNewThreadCategory(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Related company (optional)"
              value={newThreadCompany}
              onChange={(e) => setNewThreadCompany(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Related stage (optional)"
              value={newThreadStage}
              onChange={(e) => setNewThreadStage(e.target.value)}
            />
            {!user && (
              <Input
                type="text"
                placeholder="Your display name (required for anonymous posts)"
                value={newThreadAuthorName}
                onChange={(e) => setNewThreadAuthorName(e.target.value)}
                required
              />
            )}
            <div className="flex gap-4">
              <Button
                onClick={handleCreateThread}
                disabled={!newThreadTitle.trim() || !newThreadContent.trim() || createThread.isPending}
              >
                {createThread.isPending ? 'Creating...' : 'Create Thread'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </main>
      <Footer />
    </div>
  );
}

function ThreadCard({ thread, index }: { thread: ForumThread; index: number }) {
  const rotation = index % 2 === 0 ? '-rotate-1' : 'rotate-1';
  const authorDisplay = thread.author_username || thread.author_display_name || 'Anonymous';

  return (
    <Link href={`/forum/${thread.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
        <div className={`relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform ${rotation} group-hover:rotate-0 transition-transform`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-ink-900 dark:text-cream-50 mb-2">
                {thread.is_pinned && '📌 '}
                {thread.title}
              </h3>
              <div
                className="prose prose-sm dark:prose-invert max-w-none font-body text-sm text-ink-700 dark:text-ink-300 line-clamp-2 mb-2"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.content || '') }}
              />
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {thread.related_company && (
                  <div className="inline-block bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                    <span className="font-body text-xs uppercase tracking-wider font-black text-white">
                      {thread.related_company}
                    </span>
                  </div>
                )}
                {thread.related_stage && (
                  <div className="inline-block bg-blue-600 dark:bg-blue-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                    <span className="font-body text-xs uppercase tracking-wider font-black text-white">
                      {thread.related_stage}
                    </span>
                  </div>
                )}
                {thread.category && (
                  <div className="inline-block bg-purple-600 dark:bg-purple-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                    <span className="font-body text-xs uppercase tracking-wider font-black text-white">
                      {thread.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="font-body font-bold text-ink-600 dark:text-ink-400">
                {authorDisplay}
              </span>
              <span className="font-body text-ink-500 dark:text-ink-500">
                {format(new Date(thread.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-body font-bold text-ink-600 dark:text-ink-400">
                <MessageSquare className="w-4 h-4" />
                {thread.reply_count}
              </span>
              <span className="font-body text-ink-500 dark:text-ink-500">
                {thread.view_count} views
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
