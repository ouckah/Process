'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { processApi } from '@/lib/api';
import type { Process, ProcessDetail, ProcessCreate, ProcessUpdate } from '@/types';

export function useProcesses() {
  return useQuery({
    queryKey: ['processes'],
    queryFn: () => processApi.getAll(),
  });
}

export function useProcess(id: number) {
  return useQuery({
    queryKey: ['process', id],
    queryFn: () => processApi.getById(id),
    enabled: !!id,
  });
}

export function useProcessDetail(id: number) {
  return useQuery({
    queryKey: ['process', id, 'detail'],
    queryFn: () => processApi.getDetail(id),
    enabled: !!id,
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ProcessCreate) => processApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProcessUpdate }) =>
      processApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.id] });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => processApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });
}

export function useToggleSharing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: number; isPublic: boolean }) =>
      processApi.toggleSharing(id, isPublic),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.id] });
    },
  });
}

