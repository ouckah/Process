'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="relative bg-cream-50 dark:bg-ink-950 border-t-4 border-ink-900 dark:border-cream-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
          <div>
            <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
              <p className="text-sm font-body font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                © {new Date().getFullYear()} Process. All rights reserved.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/privacy" 
                className="block"
              >
                <div className="bg-cream-100 dark:bg-ink-800 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 hover:rotate-0 transition-transform">
                  <span className="font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                    Privacy Policy
                  </span>
                </div>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/terms" 
                className="block"
              >
                <div className="bg-cream-100 dark:bg-ink-800 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 hover:rotate-0 transition-transform">
                  <span className="font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                    Terms of Service
                  </span>
                </div>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/feedback" 
                className="block"
              >
                <div className="bg-cream-100 dark:bg-ink-800 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 hover:rotate-0 transition-transform">
                  <span className="font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                    Feedback
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
