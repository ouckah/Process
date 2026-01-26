'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stageApi } from '@/lib/api';
import type { Stage, StageCreate, StageUpdate } from '@/types';

export function useStages(processId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['stages', processId],
    queryFn: () => stageApi.getByProcess(processId),
    enabled: options?.enabled !== false && !!processId,
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: StageCreate) => stageApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stages', variables.process_id] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.process_id, 'detail'] });
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StageUpdate }) =>
      stageApi.update(id, data),
    onSuccess: (stage) => {
      queryClient.invalidateQueries({ queryKey: ['stages', stage.process_id] });
      queryClient.invalidateQueries({ queryKey: ['process', stage.process_id, 'detail'] });
    },
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => stageApi.delete(id),
    onSuccess: (stage) => {
      queryClient.invalidateQueries({ queryKey: ['stages', stage.process_id] });
      queryClient.invalidateQueries({ queryKey: ['process', stage.process_id, 'detail'] });
    },
  });
}

export function useReorderStages() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (stages: Array<{ id: number; order: number }>) => stageApi.reorder(stages),
    onSuccess: (stages) => {
      if (stages.length > 0) {
        const processId = stages[0].process_id;
        queryClient.invalidateQueries({ queryKey: ['stages', processId] });
        queryClient.invalidateQueries({ queryKey: ['process', processId, 'detail'] });
      }
    },
  });
}

