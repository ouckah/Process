'use client';

import React from 'react';
import Link from 'next/link';
import { OAuthButtons } from './OAuthButtons';

export function RegisterForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6 bg-cream-50 dark:bg-ink-900 p-8 rounded-lg shadow-md border border-ink-200 dark:border-ink-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-cream-50 mb-2">Create an account</h2>
          <p className="font-body text-sm text-ink-600 dark:text-ink-400">Sign up with Google or Discord to get started</p>
        </div>

        <OAuthButtons mode="register" />

        <p className="text-center text-sm text-ink-600 dark:text-ink-400">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

