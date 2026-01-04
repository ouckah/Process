'use client';

import React from 'react';
import Link from 'next/link';
import { OAuthButtons } from './OAuthButtons';

export function RegisterForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create an account</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign up with Google or Discord to get started</p>
        </div>

        <OAuthButtons mode="register" />

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

