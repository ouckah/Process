'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { User, Menu, X } from 'lucide-react';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: adminData } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-cream-50 dark:bg-ink-950 border-b-4 border-ink-900 dark:border-cream-50 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link 
              href={isAuthenticated ? '/dashboard' : '/'} 
              className="relative group"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 group-hover:rotate-0 transition-transform">
                  <span className="font-display text-2xl font-black text-cream-50 dark:text-ink-900 uppercase tracking-tight">
                    Process
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/dashboard" 
                    className="relative block"
                  >
                    <div className="bg-cream-100 dark:bg-ink-800 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 hover:rotate-0 transition-transform">
                      <span className="font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                        Dashboard
                      </span>
                    </div>
                  </Link>
                </motion.div>
                {adminData?.is_admin && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      href="/admin/feedback" 
                      className="relative block"
                    >
                      <div className="bg-cream-100 dark:bg-ink-800 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 hover:rotate-0 transition-transform">
                        <span className="font-body text-sm font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                          Admin
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                )}
                <div className="mx-1">
                  <NotificationBadge />
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/profile" 
                    className="relative block"
                  >
                    <div className="bg-indigo-600 dark:bg-indigo-500 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 hover:rotate-0 transition-transform flex items-center gap-2">
                      <User className="w-4 h-4 text-white" />
                      <span className="font-body text-sm font-black uppercase tracking-wider text-white">
                        {user?.username}
                      </span>
                    </div>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logout}
                    className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                  >
                    Logout
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/login">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                    >
                      Login
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/register">
                    <Button 
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t-4 border-ink-900 dark:border-cream-50 overflow-hidden bg-cream-50 dark:bg-ink-950"
            >
              <nav className="flex flex-col space-y-3 py-4">
                {isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block"
                      >
                        <div className="bg-cream-100 dark:bg-ink-800 px-4 py-3 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 mx-4">
                          <span className="font-body text-base font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                            Dashboard
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                    {adminData?.is_admin && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Link
                          href="/admin/feedback"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block"
                        >
                          <div className="bg-cream-100 dark:bg-ink-800 px-4 py-3 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mx-4">
                            <span className="font-body text-base font-black uppercase tracking-wider text-ink-900 dark:text-cream-50">
                              Admin
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block"
                      >
                        <div className="bg-indigo-600 dark:bg-indigo-500 px-4 py-3 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 mx-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-white" />
                          <span className="font-body text-base font-black uppercase tracking-wider text-white">
                            {user?.username}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                    <div className="px-4 py-2">
                      <NotificationBadge />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mx-4"
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }} 
                        className="w-full border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                      >
                        Logout
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mx-4"
                    >
                      <Link 
                        href="/login" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                        >
                          Login
                        </Button>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mx-4"
                    >
                      <Link 
                        href="/register" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button 
                          size="sm" 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                        >
                          Sign Up
                        </Button>
                      </Link>
                    </motion.div>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
