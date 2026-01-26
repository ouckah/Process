'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi, setAuthToken } from '@/lib/api';
import { clearAuth, verifyAuth } from '@/lib/auth';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  updateProfile: (data: { username?: string; display_name?: string | null; is_anonymous?: boolean; comments_enabled?: boolean; email_notifications_enabled?: boolean }) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await verifyAuth();
          setUser(userData);
        }
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth expiration events
    const handleAuthExpired = () => {
      setUser(null);
      // Only redirect if not already on auth pages
      const currentPath = window.location.pathname;
      const authPaths = ['/login', '/register', '/auth'];
      const isAuthPage = authPaths.some(path => currentPath.startsWith(path));
      if (!isAuthPage) {
        router.push('/login');
      }
    };

    // Listen for new token being set (e.g., after OAuth login)
    const handleAuthTokenSet = async (event: any) => {
      const userData = event.detail?.user;
      if (userData) {
        setUser(userData);
      } else {
        // If no user data provided, fetch it
        try {
          const user = await verifyAuth();
          setUser(user);
        } catch (error) {
          clearAuth();
        }
      }
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    window.addEventListener('auth-token-set', handleAuthTokenSet);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
      window.removeEventListener('auth-token-set', handleAuthTokenSet);
    };
  }, [router]);


  const logout = () => {
    authApi.logout();
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (data: { username?: string; display_name?: string | null; is_anonymous?: boolean; comments_enabled?: boolean; email_notifications_enabled?: boolean }) => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        updateProfile,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

