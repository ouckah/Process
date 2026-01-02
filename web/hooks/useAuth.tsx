'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi, setAuthToken } from '@/lib/api';
import { clearAuth, verifyAuth } from '@/lib/auth';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    try {
      const tokenData = await authApi.login(email, password);
      if (!tokenData.access_token) {
        throw new Error('No access token received');
      }
      
      // Verify token is stored before calling getMe
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken || storedToken !== tokenData.access_token) {
        // If token wasn't stored, store it now
        localStorage.setItem('auth_token', tokenData.access_token);
      }
      
      // Small delay to ensure token is available
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const userData = await authApi.getMe();
      setUser(userData);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      // Clear token on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      await authApi.register(email, username, password);
      // Auto-login after registration
      await login(email, password);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

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
        login,
        register,
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

