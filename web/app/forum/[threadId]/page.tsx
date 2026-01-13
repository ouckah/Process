'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useForumThread } from '@/hooks/useForum';
import { useCreateReply, useUpvoteReply, useRemoveUpvote } from '@/hooks/useForum';
import { Loader2, ArrowLeft, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { MarkdownTextarea } from '@/components/ui/MarkdownTextarea';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { ForumReply } from '@/types';
import { renderMarkdown } from '@/lib/utils';

export default function ForumThreadPage() {
  const params = useParams();
  const threadId = parseInt(params.threadId as string);
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [parentReplyId, setParentReplyId] = useState<number | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState('');

  const { data: thread, isLoading } = useForumThread(threadId);
  const createReply = useCreateReply();
  const upvoteReply = useUpvoteReply();
  const removeUpvote = useRemoveUpvote();
  const [upvotingReplyId, setUpvotingReplyId] = useState<number | null>(null);

  const handleCreateReply = async () => {
    if (!replyContent.trim()) return;
    
    try {
      await createReply.mutateAsync({
        threadId,
        data: {
          content: replyContent,
          parent_reply_id: parentReplyId,
          author_display_name: user ? null : (replyAuthorName || null),
        },
      });
      setReplyContent('');
      setParentReplyId(null);
      setReplyAuthorName('');
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleUpvote = async (replyId: number, hasUpvoted: boolean) => {
    if (!user || upvotingReplyId === replyId) return;
    
    setUpvotingReplyId(replyId);
    try {
      if (hasUpvoted) {
        await removeUpvote.mutateAsync(replyId);
      } else {
        await upvoteReply.mutateAsync(replyId);
      }
    } catch (error: any) {
      // If we get a 400 "Already upvoted" error, try to remove the upvote instead
      // This handles race conditions where the state might be stale
      if (error?.response?.status === 400 && error?.response?.data?.detail === 'Already upvoted') {
        try {
          await removeUpvote.mutateAsync(replyId);
        } catch (removeError) {
          console.error('Failed to remove upvote after conflict:', removeError);
        }
      } else {
        console.error('Failed to toggle upvote:', error);
      }
    } finally {
      setUpvotingReplyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
        <Header />
        <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
            <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
              <p className="font-body text-lg font-black uppercase tracking-wider text-white">Thread not found</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const authorDisplay = thread.author_username || thread.author_display_name || 'Anonymous';

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Button */}
        <Link href="/forum" className="mb-6 inline-block">
          <motion.div
            whileHover={{ scale: 1.05, x: -4, y: -4 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
            <div className="relative bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5 text-cream-50 dark:text-ink-900" />
              <span className="font-body text-sm uppercase tracking-wider font-black text-cream-50 dark:text-ink-900">
                Back to Forum
              </span>
            </div>
          </motion.div>
        </Link>

        {/* Thread */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group mb-8"
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
            <div className="flex items-start justify-between mb-4">
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink-900 dark:text-cream-50 flex-1">
                {thread.is_pinned && '📌 '}
                {thread.title}
              </h1>
            </div>
            
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <Avatar
                discordAvatar={thread.author_discord_avatar}
                discordId={thread.author_discord_id}
                username={thread.author_username || authorDisplay || 'Anonymous'}
                size="sm"
              />
              <span className="font-body font-bold text-ink-700 dark:text-ink-300">{authorDisplay}</span>
              <span className="font-body text-sm text-ink-500 dark:text-ink-500">
                {format(new Date(thread.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            {/* Badges */}
            {(thread.related_company || thread.related_stage || thread.category) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
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
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
              <div
                className="font-body text-ink-800 dark:text-ink-200"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.content || '') }}
              />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="font-body font-bold text-ink-600 dark:text-ink-400">
                {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
              </span>
              <span className="font-body text-ink-500 dark:text-ink-500">
                {thread.view_count} views
              </span>
            </div>
          </div>
        </motion.div>

        {/* Replies */}
        <div className="space-y-4 mb-8">
          {thread.replies.map((reply, index) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              index={index}
              onReply={(parentId) => {
                setParentReplyId(parentId);
                setReplyContent('');
              }}
              onUpvote={handleUpvote}
              user={user}
              upvotingReplyId={upvotingReplyId}
            />
          ))}
        </div>

        {/* Reply Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
            <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                {parentReplyId ? 'Reply to Comment' : 'Add Reply'}
              </h3>
            </div>
            
            {parentReplyId && (
              <button
                onClick={() => setParentReplyId(null)}
                className="mb-6 mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Cancel reply
              </button>
            )}

            <MarkdownTextarea
              value={replyContent}
              onChange={(value) => setReplyContent(value)}
              placeholder="Write your reply..."
              rows={6}
              className="mb-4"
            />
            
            {!user && (
              <input
                type="text"
                placeholder="Your display name (required for anonymous posts)"
                value={replyAuthorName}
                onChange={(e) => setReplyAuthorName(e.target.value)}
                className="w-full mb-4 bg-cream-50 dark:bg-ink-900 border-2 border-ink-900 dark:border-cream-50 px-4 py-2 font-body"
                required
              />
            )}

            <Button
              onClick={handleCreateReply}
              disabled={!replyContent.trim() || createReply.isPending}
            >
              {createReply.isPending ? 'Posting...' : 'Post Reply'}
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

function ReplyItem({
  reply,
  index,
  onReply,
  onUpvote,
  user,
  upvotingReplyId,
}: {
  reply: ForumReply;
  index: number;
  onReply: (parentId: number) => void;
  onUpvote: (replyId: number, hasUpvoted: boolean) => void;
  user: any;
  upvotingReplyId: number | null;
}) {
  const rotation = index % 2 === 0 ? '-rotate-1' : 'rotate-1';
  const authorDisplay = reply.author_username || reply.author_display_name || 'Anonymous';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
      <div className={`relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform ${rotation}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              discordAvatar={reply.author_discord_avatar}
              discordId={reply.author_discord_id}
              username={reply.author_username || authorDisplay || 'Anonymous'}
              size="sm"
            />
            <div>
              <span className="font-body font-bold text-ink-700 dark:text-ink-300">{authorDisplay}</span>
              <span className="font-body text-xs text-ink-500 dark:text-ink-500 ml-2">
                {format(new Date(reply.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(reply.id, reply.user_has_upvoted);
            }}
            disabled={!user || upvotingReplyId === reply.id}
            className={`flex items-center gap-1 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 ${
              reply.user_has_upvoted
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'bg-cream-100 dark:bg-ink-800 text-ink-900 dark:text-cream-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="font-body text-xs font-black">{reply.upvotes}</span>
          </button>
        </div>

        <div
          className="prose prose-sm dark:prose-invert max-w-none font-body text-ink-800 dark:text-ink-200 mb-4"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.content || '') }}
        />

        <button
          onClick={() => onReply(reply.id)}
          className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
        >
          Reply
        </button>

        {/* Nested Replies */}
        {reply.nested_replies && reply.nested_replies.length > 0 && (
          <div className="mt-4 ml-8 space-y-4 border-l-4 border-ink-900 dark:border-cream-50 pl-4">
            {reply.nested_replies.map((nestedReply, nestedIndex) => (
              <ReplyItem
                key={nestedReply.id}
                reply={nestedReply}
                index={nestedIndex}
                onReply={onReply}
                onUpvote={onUpvote}
                user={user}
                upvotingReplyId={upvotingReplyId}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
