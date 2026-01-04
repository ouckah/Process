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
  updateProfile: (data: { username?: string; display_name?: string | null; is_anonymous?: boolean; comments_enabled?: boolean }) => Promise<void>;
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
  }, []);


  const logout = () => {
    authApi.logout();
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (data: { username?: string; display_name?: string | null; is_anonymous?: boolean; comments_enabled?: boolean }) => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        updateProfile,
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

