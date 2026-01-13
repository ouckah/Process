'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'error', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'error':
        return 'bg-red-600 dark:bg-red-800 border-red-700 dark:border-red-900 text-white';
      case 'success':
        return 'bg-green-600 dark:bg-green-800 border-green-700 dark:border-green-900 text-white';
      case 'warning':
        return 'bg-yellow-600 dark:bg-yellow-800 border-yellow-700 dark:border-yellow-900 text-white';
      case 'info':
        return 'bg-blue-600 dark:bg-blue-800 border-blue-700 dark:border-blue-900 text-white';
      default:
        return 'bg-gray-600 dark:bg-gray-800 border-gray-700 dark:border-gray-900 text-white';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto ${getToastStyles(toast.type)} border-4 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] px-4 py-3 min-w-[300px] max-w-[500px] flex items-start gap-3`}
            >
              {toast.type === 'error' && toast.message.includes('rate limit') && (
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              {toast.type === 'error' && !toast.message.includes('rate limit') && (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              {toast.type !== 'error' && getIcon(toast.type)}
              <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Component to listen for rate limit events from API interceptor
export function RateLimitListener() {
  const { showToast } = useToast();

  useEffect(() => {
    const handleRateLimit = (event: CustomEvent<{ message: string }>) => {
      showToast(event.detail.message, 'error', 8000);
    };

    window.addEventListener('api-rate-limit', handleRateLimit as EventListener);

    return () => {
      window.removeEventListener('api-rate-limit', handleRateLimit as EventListener);
    };
  }, [showToast]);

  return null;
}
