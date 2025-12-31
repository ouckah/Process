'use client';

import React, { useState } from 'react';
import { useProcesses, useDeleteProcess } from '@/hooks/useProcesses';
import { ProcessCard } from './ProcessCard';
import { Button } from '@/components/ui/Button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';

export function ProcessList() {
  const { data: processes, isLoading, error } = useProcesses();
  const deleteProcess = useDeleteProcess();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    setProcessToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (processToDelete) {
      deleteProcess.mutate(processToDelete, {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setProcessToDelete(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Failed to load processes. Please try again.
      </div>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No processes yet. Create your first one!</p>
        <Link href="/processes/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Create Process
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Processes</h2>
        <Link href="/processes/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            New Process
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processes.map((process) => (
          <ProcessCard
            key={process.id}
            process={process}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProcessToDelete(null);
        }}
        title="Delete Process"
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete this process? This will also delete all associated stages. This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteModalOpen(false);
              setProcessToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

