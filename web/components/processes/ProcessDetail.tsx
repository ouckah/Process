'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProcessDetail, useDeleteProcess, useUpdateProcess } from '@/hooks/useProcesses';
import { useStages, useCreateStage, useUpdateStage, useDeleteStage } from '@/hooks/useStages';
import { StageTimeline } from '@/components/stages/StageTimeline';
import { StageForm } from '@/components/stages/StageForm';
import { ProcessForm } from './ProcessForm';
import { ShareButton } from './ShareButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import type { Stage, StageCreate, StageUpdate, ProcessUpdate } from '@/types';

interface ProcessDetailProps {
  processId: number;
  onEdit?: () => void;
}

export function ProcessDetail({ processId, onEdit }: ProcessDetailProps) {
  const router = useRouter();
  const { data: process, isLoading, error } = useProcessDetail(processId);
  const { data: stages } = useStages(processId);
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const deleteProcess = useDeleteProcess();
  const updateProcess = useUpdateProcess();

  const [isEditMode, setIsEditMode] = useState(false);
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStageModalOpen, setDeleteStageModalOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<number | null>(null);

  // Check URL params for edit mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get('edit');
      setIsEditMode(editParam === 'true');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Failed to load process. Please try again.
      </div>
    );
  }

  const handleStageSubmit = (data: StageCreate | StageUpdate) => {
    if (editingStage) {
      updateStage.mutate({ id: editingStage.id, data }, {
        onSuccess: () => {
          setStageFormOpen(false);
          setEditingStage(null);
        },
      });
    } else {
      createStage.mutate(data as StageCreate, {
        onSuccess: () => {
          setStageFormOpen(false);
        },
      });
    }
  };

  const handleDeleteStage = (id: number) => {
    setStageToDelete(id);
    setDeleteStageModalOpen(true);
  };

  const handleDeleteStageConfirm = () => {
    if (stageToDelete) {
      deleteStage.mutate(stageToDelete, {
        onSuccess: () => {
          setDeleteStageModalOpen(false);
          setStageToDelete(null);
        },
      });
    }
  };

  const handleDeleteProcess = () => {
    deleteProcess.mutate(processId);
  };

  const handleProcessUpdate = (data: ProcessUpdate) => {
    updateProcess.mutate(
      { id: processId, data },
      {
        onSuccess: () => {
          setIsEditMode(false);
          // Remove edit param from URL
          router.replace(`/processes/${processId}`);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Remove edit param from URL
    router.replace(`/processes/${processId}`);
  };

  return (
    <div className="space-y-6">
      {/* Process Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {isEditMode ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Process</h2>
            <ProcessForm
              process={process}
              onSubmit={handleProcessUpdate}
              onCancel={handleCancelEdit}
              loading={updateProcess.isPending}
            />
          </div>
        ) : (
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{process.company_name}</h1>
                <StatusBadge status={process.status} />
              </div>
              {process.position && (
                <p className="text-xl text-gray-600 mb-2">{process.position}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Created: {formatDate(process.created_at)}</span>
                {process.updated_at !== process.created_at && (
                  <span>Updated: {formatDate(process.updated_at)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ShareButton process={process} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditMode(true);
                  router.push(`/processes/${processId}?edit=true`);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline and Stages */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Process Timeline</h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingStage(null);
              setStageFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stage
          </Button>
        </div>
        <StageTimeline
          stages={stages || []}
          onEdit={(stage) => {
            setEditingStage(stage);
            setStageFormOpen(true);
          }}
          onDelete={handleDeleteStage}
        />
      </div>

      {/* Stage Form Modal */}
      <Modal
        isOpen={stageFormOpen}
        onClose={() => {
          setStageFormOpen(false);
          setEditingStage(null);
        }}
        title={editingStage ? 'Edit Stage' : 'Add Stage'}
      >
        <StageForm
          processId={processId}
          stage={editingStage}
          onSubmit={handleStageSubmit}
          onCancel={() => {
            setStageFormOpen(false);
            setEditingStage(null);
          }}
          loading={createStage.isPending || updateStage.isPending}
        />
      </Modal>

      {/* Delete Process Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Process"
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete this process? This will also delete all associated stages. This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteProcess}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Delete Stage Modal */}
      <Modal
        isOpen={deleteStageModalOpen}
        onClose={() => {
          setDeleteStageModalOpen(false);
          setStageToDelete(null);
        }}
        title="Delete Stage"
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete this stage? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteStageModalOpen(false);
              setStageToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteStageConfirm}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

