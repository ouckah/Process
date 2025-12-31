import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

export function useAdmin() {
  return useQuery({
    queryKey: ['admin', 'check'],
    queryFn: () => authApi.checkAdmin(),
    retry: false,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
}

