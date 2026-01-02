'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProcesses, useDeleteProcess } from '@/hooks/useProcesses';
import { ProcessCard } from './ProcessCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Loader2, Search, X, CheckSquare, Square, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUpdateProcess } from '@/hooks/useProcesses';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRef } from 'react';
import type { Process } from '@/types';

type SortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'company_asc' | 'company_desc' | 'status_asc' | 'status_desc';
type StatusFilter = 'all' | 'active' | 'completed' | 'rejected';

export function ProcessList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: processes, isLoading, error } = useProcesses();
  const deleteProcess = useDeleteProcess();
  const updateProcess = useUpdateProcess();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProcessIds, setSelectedProcessIds] = useState<Set<number>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<'active' | 'completed' | 'rejected'>('active');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get initial state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>((searchParams.get('status') as StatusFilter) || 'all');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'updated_desc');

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      action: () => searchInputRef.current?.focus(),
      description: 'Focus search input',
    },
    {
      key: 'f',
      action: () => setSelectionMode(!selectionMode),
      description: 'Toggle selection mode',
    },
  ]);

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

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortBy !== 'updated_desc') params.set('sort', sortBy);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(newUrl, { scroll: false });
  }, [searchTerm, statusFilter, sortBy, router]);

  // Filter and sort processes
  const filteredAndSortedProcesses = useMemo(() => {
    if (!processes) return [];

    let filtered: Process[] = [...processes];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.company_name.toLowerCase().includes(searchLower) ||
          (p.position && p.position.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'updated_desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'updated_asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'company_asc':
          return a.company_name.localeCompare(b.company_name);
        case 'company_desc':
          return b.company_name.localeCompare(a.company_name);
        case 'status_asc':
          return a.status.localeCompare(b.status);
        case 'status_desc':
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [processes, searchTerm, statusFilter, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (sortBy !== 'updated_desc') count++;
    return count;
  }, [searchTerm, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('updated_desc');
  };

  // Bulk operations
  const toggleSelection = (processId: number) => {
    setSelectedProcessIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedProcessIds(new Set(filteredAndSortedProcesses.map(p => p.id)));
  };

  const selectNone = () => {
    setSelectedProcessIds(new Set());
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedProcessIds);
    // Delete processes sequentially
    ids.forEach((id, index) => {
      setTimeout(() => {
        deleteProcess.mutate(id, {
          onSuccess: () => {
            if (index === ids.length - 1) {
              setSelectedProcessIds(new Set());
              setSelectionMode(false);
              setBulkDeleteModalOpen(false);
            }
          },
        });
      }, index * 100); // Small delay to avoid overwhelming the API
    });
  };

  const handleBulkStatusUpdate = () => {
    const ids = Array.from(selectedProcessIds);
    ids.forEach((id, index) => {
      setTimeout(() => {
        updateProcess.mutate({
          id,
          data: { status: bulkStatusValue },
        }, {
          onSuccess: () => {
            if (index === ids.length - 1) {
              setSelectedProcessIds(new Set());
              setSelectionMode(false);
              setBulkStatusModalOpen(false);
            }
          },
        });
      }, index * 100);
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedProcessIds(new Set());
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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
        Failed to load processes. Please try again.
      </div>
    );
  }

  const hasNoProcesses = !processes || processes.length === 0;
  const hasNoFilteredResults = !hasNoProcesses && filteredAndSortedProcesses.length === 0;

  if (hasNoProcesses) {
    return <EmptyState type="no-processes" />;
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Your Processes
          {filteredAndSortedProcesses.length !== processes.length && (
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({filteredAndSortedProcesses.length} of {processes.length})
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {!selectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => setSelectionMode(true)}
              >
                <CheckSquare className="w-5 h-5 mr-2" />
                Select
              </Button>
              <Link href="/processes/new">
                <Button>
                  <Plus className="w-5 h-5 mr-2" />
                  New Process
                </Button>
              </Link>
            </>
          ) : (
            <Button variant="outline" onClick={exitSelectionMode}>
              Cancel Selection
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectionMode && selectedProcessIds.size > 0 && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {selectedProcessIds.size} process{selectedProcessIds.size !== 1 ? 'es' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedProcessIds.size === filteredAndSortedProcesses.length ? selectNone : selectAll}
              >
                {selectedProcessIds.size === filteredAndSortedProcesses.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkStatusModalOpen(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Update Status
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              ref={searchInputRef}
              placeholder="Search by company name or position... (Press 's' to focus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-48">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              options={[
                { value: 'updated_desc', label: 'Recently Updated' },
                { value: 'updated_asc', label: 'Oldest Updated' },
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'company_asc', label: 'Company A-Z' },
                { value: 'company_desc', label: 'Company Z-A' },
                { value: 'status_asc', label: 'Status A-Z' },
                { value: 'status_desc', label: 'Status Z-A' },
              ]}
            />
          </div>
        </div>

        {/* Active Filters Badge and Clear */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* No Results Message */}
      {hasNoFilteredResults && (
        <EmptyState
          type="no-results"
          onAction={clearFilters}
        />
      )}

      {/* Process Grid */}
      {!hasNoFilteredResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProcesses.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              onDelete={handleDeleteClick}
              selectionMode={selectionMode}
              isSelected={selectedProcessIds.has(process.id)}
              onToggleSelection={() => toggleSelection(process.id)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProcessToDelete(null);
        }}
        title="Delete Process"
      >
        <p className="text-gray-700 dark:text-gray-300 mb-4">
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

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        title="Delete Selected Processes"
      >
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Are you sure you want to delete {selectedProcessIds.size} process{selectedProcessIds.size !== 1 ? 'es' : ''}? 
          This will also delete all associated stages. This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setBulkDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBulkDelete}>
            Delete {selectedProcessIds.size} Process{selectedProcessIds.size !== 1 ? 'es' : ''}
          </Button>
        </div>
      </Modal>

      {/* Bulk Status Update Modal */}
      <Modal
        isOpen={bulkStatusModalOpen}
        onClose={() => setBulkStatusModalOpen(false)}
        title="Update Status for Selected Processes"
      >
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Update status for {selectedProcessIds.size} process{selectedProcessIds.size !== 1 ? 'es' : ''}:
        </p>
        <div className="mb-4">
          <Select
            value={bulkStatusValue}
            onChange={(e) => setBulkStatusValue(e.target.value as 'active' | 'completed' | 'rejected')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setBulkStatusModalOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleBulkStatusUpdate}>
            Update {selectedProcessIds.size} Process{selectedProcessIds.size !== 1 ? 'es' : ''}
          </Button>
        </div>
      </Modal>
    </>
  );
}

