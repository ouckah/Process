'use client';

import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/lib/api';
import type { PublicProfileResponse } from '@/types';

export function usePublicProfile(username: string) {
  return useQuery<PublicProfileResponse, Error>({
    queryKey: ['publicProfile', username],
    queryFn: () => profileApi.getPublicProfile(username),
    enabled: !!username,
  });
}

