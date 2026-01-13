import { useQuery } from '@tanstack/react-query';
import { exploreApi, type ExploreProcessPaginatedResponse } from '@/lib/api';
import type { ExploreStats } from '@/types';

export function useExploreProcesses(params?: {
  search?: string;
  company?: string;
  stage?: string;
  position?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['explore', 'processes', params],
    queryFn: () => exploreApi.getProcesses(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

export function useExploreCompanies() {
  return useQuery({
    queryKey: ['explore', 'companies'],
    queryFn: () => exploreApi.getCompanies(),
    staleTime: 5 * 60 * 1000, // Companies list changes infrequently
    gcTime: 10 * 60 * 1000,
  });
}

export function useExploreStages() {
  return useQuery({
    queryKey: ['explore', 'stages'],
    queryFn: () => exploreApi.getStages(),
    staleTime: 5 * 60 * 1000, // Stages list changes infrequently
    gcTime: 10 * 60 * 1000,
  });
}

export function useExploreStats() {
  return useQuery({
    queryKey: ['explore', 'stats'],
    queryFn: () => exploreApi.getStats(),
    staleTime: 60000, // Stats update every minute
    gcTime: 5 * 60 * 1000,
  });
}
