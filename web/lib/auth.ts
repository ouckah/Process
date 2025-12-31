import { setAuthToken } from './api';
import { authApi } from './api';
import type { User } from '@/types';

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
};

// Get stored token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Clear authentication
export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  setAuthToken(null);
};

// Verify token is still valid
export const verifyAuth = async (): Promise<User | null> => {
  try {
    const user = await authApi.getMe();
    return user;
  } catch (error) {
    clearAuth();
    return null;
  }
};

