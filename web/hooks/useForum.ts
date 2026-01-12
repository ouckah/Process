import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '@/lib/api';
import type { ForumThread, ForumThreadCreate, ForumThreadUpdate, ForumReply, ForumReplyCreate, ForumReplyUpdate } from '@/types';

export function useForumThreads(params?: {
  category?: string;
  company?: string;
  stage?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['forum', 'threads', params],
    queryFn: () => forumApi.getThreads(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

export function useForumThread(threadId: number) {
  return useQuery({
    queryKey: ['forum', 'thread', threadId],
    queryFn: () => forumApi.getThread(threadId),
    enabled: !!threadId,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ForumThreadCreate) => forumApi.createThread(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
    },
  });
}

export function useUpdateThread() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: number; data: ForumThreadUpdate }) =>
      forumApi.updateThread(threadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', variables.threadId] });
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (threadId: number) => forumApi.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
    },
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: number; data: ForumReplyCreate }) =>
      forumApi.createReply(threadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
    },
  });
}

export function useUpdateReply() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ replyId, data }: { replyId: number; data: ForumReplyUpdate }) =>
      forumApi.updateReply(replyId, data),
    onSuccess: (reply) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', reply.thread_id] });
    },
  });
}

export function useDeleteReply() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (replyId: number) => forumApi.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
    },
  });
}

export function useUpvoteReply() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (replyId: number) => forumApi.upvoteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}

export function useRemoveUpvote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (replyId: number) => forumApi.removeUpvote(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}
