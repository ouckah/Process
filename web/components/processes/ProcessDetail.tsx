'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProcessDetail, usePublicProcessDetail, useDeleteProcess, useUpdateProcess } from '@/hooks/useProcesses';
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
import { motion } from 'framer-motion';
import type { Stage, StageCreate, StageUpdate, ProcessUpdate } from '@/types';

interface ProcessDetailProps {
  processId: number;
  onEdit?: () => void;
  isPublic?: boolean;
}

export function ProcessDetail({ processId, onEdit, isPublic = false }: ProcessDetailProps) {
  const router = useRouter();
  const { data: process: authProcess, isLoading: authLoading, error: authError } = useProcessDetail(processId);
  const { data: publicProcess, isLoading: publicLoading, error: publicError } = usePublicProcessDetail(processId);
  
  // Use public process if isPublic is true, otherwise use authenticated process
  const process = isPublic ? publicProcess : authProcess;
  const isLoading = isPublic ? publicLoading : authLoading;
  const error = isPublic ? publicError : authError;
  
  // For public processes, use stages from process data; for authenticated, fetch separately
  const { data: fetchedStages } = useStages(processId, { enabled: !isPublic });
  const stages = isPublic ? (process?.stages || []) : (fetchedStages || []);
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const deleteProcess = useDeleteProcess();
  const updateProcess = useUpdateProcess();
  
  // Disable mutations for public processes
  const canEdit = !isPublic;

  const [isEditMode, setIsEditMode] = useState(false);
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStageModalOpen, setDeleteStageModalOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<number | null>(null);

  // Check URL params for edit mode on mount (only if not public)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isPublic) {
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get('edit');
      setIsEditMode(editParam === 'true');
    }
  }, [isPublic]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-2 translate-y-2"></div>
        <div className="relative bg-red-600 dark:bg-red-500 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
          <p className="font-body text-base font-black uppercase tracking-wider text-white">
            Failed to load process. Please try again.
          </p>
        </div>
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
    deleteProcess.mutate(processId, {
      onSuccess: () => {
        router.push('/dashboard');
      },
    });
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
    <div className="space-y-12">
      {/* Process Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform rotate-1">
          {isEditMode ? (
            <div>
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-6">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Edit Process
                </h2>
              </div>
              <ProcessForm
                process={process}
                onSubmit={handleProcessUpdate}
                onCancel={handleCancelEdit}
                loading={updateProcess.isPending}
              />
            </div>
          ) : (
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4 flex-wrap">
                  <h1 className="font-display text-4xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight">
                    {process.company_name}
                  </h1>
                  <StatusBadge status={process.status} />
                </div>
                {process.position && (
                  <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                    <p className="font-body text-xl font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                      {process.position}
                    </p>
                  </div>
                )}
                {process.description && (
                  <div className="relative group mb-4">
                    <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                    <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
                      <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-3">
                        <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                          Process Description
                        </p>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none font-body text-ink-900 dark:text-cream-50 whitespace-pre-wrap">
                        {process.description}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-4 flex-wrap gap-2">
                  <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
                    <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                      Created: {formatDate(process.created_at)}
                    </p>
                  </div>
                  {process.updated_at !== process.created_at && (
                    <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
                      <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                        Updated: {formatDate(process.updated_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
                <ShareButton process={process} />
                {canEdit && (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditMode(true);
                          router.push(`/processes/${processId}?edit=true`);
                        }}
                        className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModalOpen(true)}
                        className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Timeline and Stages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform -rotate-1">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Process Timeline
              </h2>
            </div>
            {canEdit && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingStage(null);
                    setStageFormOpen(true);
                  }}
                  className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stage
                </Button>
              </motion.div>
            )}
          </div>
          <StageTimeline
            stages={stages || []}
            onEdit={canEdit ? ((stage) => {
              setEditingStage(stage);
              setStageFormOpen(true);
            }) : undefined}
            onDelete={canEdit ? handleDeleteStage : undefined}
          />
        </div>
      </motion.div>

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
        <div className="space-y-6">
          <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-4 border-ink-900 dark:border-cream-50 transform rotate-1">
            <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
              Are you sure you want to delete this process? This will also delete all associated stages. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider">
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="danger" onClick={handleDeleteProcess} className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider">
                Delete
              </Button>
            </motion.div>
          </div>
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
        <div className="space-y-6">
          <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1">
            <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
              Are you sure you want to delete this stage? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteStageModalOpen(false);
                  setStageToDelete(null);
                }}
                className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="danger" onClick={handleDeleteStageConfirm} className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider">
                Delete
              </Button>
            </motion.div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
