import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '@/lib/api';
import type { Feedback, FeedbackCreate } from '@/types';

// Query keys
const feedbackKeys = {
  all: ['feedback'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
};

// Hook for submitting feedback
export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeedbackCreate) => feedbackApi.submit(data),
    onSuccess: () => {
      // Invalidate feedback list to refresh admin view
      queryClient.invalidateQueries({ queryKey: feedbackKeys.lists() });
    },
  });
}

// Hook for fetching all feedback (admin only)
export function useFeedback() {
  return useQuery({
    queryKey: feedbackKeys.lists(),
    queryFn: () => feedbackApi.getAll(),
  });
}

