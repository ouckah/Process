'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCreateProcess } from '@/hooks/useProcesses';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProcessForm } from '@/components/processes/ProcessForm';
import { Loader2 } from 'lucide-react';
import type { ProcessCreate, ProcessUpdate } from '@/types';

export default function NewProcessPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const createProcess = useCreateProcess();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = (data: ProcessCreate | ProcessUpdate) => {
    // For new process, we know it's always ProcessCreate (all fields required)
    createProcess.mutate(data as ProcessCreate, {
      onSuccess: (process) => {
        router.push(`/processes/${process.id}`);
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Process</h1>
          <ProcessForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/dashboard')}
            loading={createProcess.isPending}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

