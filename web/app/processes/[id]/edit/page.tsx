'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProcess, useUpdateProcess } from '@/hooks/useProcesses';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProcessForm } from '@/components/processes/ProcessForm';
import { Loader2 } from 'lucide-react';
import type { ProcessUpdate } from '@/types';

export default function EditProcessPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const processId = parseInt(params.id as string);
  const { data: process, isLoading } = useProcess(processId);
  const updateProcess = useUpdateProcess();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = (data: ProcessUpdate) => {
    updateProcess.mutate(
      { id: processId, data },
      {
        onSuccess: () => {
          router.push(`/processes/${processId}`);
        },
      }
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isNaN(processId) || !process) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Process not found
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Process</h1>
          <ProcessForm
            process={process}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/processes/${processId}`)}
            loading={updateProcess.isPending}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

