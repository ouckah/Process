'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '@/lib/api';
import type { ProfileComment, ProfileCommentCreate, ProfileCommentUpdate } from '@/types';

export function useProfileComments(username: string) {
  return useQuery<ProfileComment[], Error>({
    queryKey: ['profileComments', username],
    queryFn: () => commentApi.getComments(username),
    enabled: !!username,
  });
}

export function useCreateComment(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileCommentCreate) => commentApi.createComment(username, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileComments', username] });
    },
  });
}

export function useUpdateComment(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: ProfileCommentUpdate }) =>
      commentApi.updateComment(username, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileComments', username] });
    },
  });
}

export function useDeleteComment(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => commentApi.deleteComment(username, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileComments', username] });
    },
  });
}

export function useReplyToComment(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: ProfileCommentCreate }) =>
      commentApi.replyToComment(username, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileComments', username] });
    },
  });
}

export function useMarkAsAnswered(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => commentApi.markAsAnswered(username, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileComments', username] });
    },
  });
}

export function useUpvoteComment(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => commentApi.upvoteComment(username, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileComments', username] });
    },
  });
}

