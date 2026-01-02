'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { User } from 'lucide-react';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: adminData } = useAdmin();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={isAuthenticated ? '/dashboard' : '/'} className="text-xl font-bold text-primary-600">
              Process
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                {adminData?.is_admin && (
                  <Link href="/admin/feedback" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </Link>
                )}
                <Link href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{user?.username}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

