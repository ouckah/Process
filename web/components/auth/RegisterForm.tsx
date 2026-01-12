'use client';

import React from 'react';
import Link from 'next/link';
import { OAuthButtons } from './OAuthButtons';
import { motion } from 'framer-motion';

export function RegisterForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform -rotate-1">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 mb-3">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Create an account
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
                <p className="font-body text-sm font-black text-ink-900 dark:text-cream-50">
                  Sign up with Google to get started
                </p>
              </div>
            </div>

            <OAuthButtons mode="register" />

            <div className="pt-4 border-t-4 border-ink-900 dark:border-cream-50">
              <p className="text-center text-sm font-bold text-ink-900 dark:text-cream-50">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="inline-block bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 hover:rotate-0 transition-transform text-white font-black uppercase tracking-wider text-xs"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

