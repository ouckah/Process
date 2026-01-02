'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { getAllTemplates, saveCustomTemplate, type ProcessTemplate } from '@/lib/templates';
import { FileText, Plus } from 'lucide-react';
import type { ProcessDetail } from '@/types';

interface ProcessTemplateProps {
  onSelectTemplate: (template: ProcessTemplate) => void;
  onSaveAsTemplate?: (process: ProcessDetail) => void;
  currentProcess?: ProcessDetail;
}

export function ProcessTemplateSelector({ onSelectTemplate, onSaveAsTemplate, currentProcess }: ProcessTemplateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const templates = getAllTemplates();

  const handleSelect = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onSelectTemplate(template);
      setIsOpen(false);
      setSelectedTemplateId('');
    }
  };

  const handleSaveAsTemplate = () => {
    if (!currentProcess || !onSaveAsTemplate) return;
    
    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    const template: ProcessTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: `Custom template from ${currentProcess.company_name}`,
      process: {
        company_name: '',
        position: currentProcess.position || undefined,
      },
      stages: (currentProcess.stages || []).map((stage, index) => ({
        stage_name: stage.stage_name,
        stage_date: new Date().toISOString().split('T')[0],
        notes: stage.notes || null,
      })),
    };

    saveCustomTemplate(template);
    alert('Template saved successfully!');
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
      >
        <FileText className="w-4 h-4 mr-2" />
        Use Template
      </Button>

      {currentProcess && onSaveAsTemplate && (
        <Button
          variant="outline"
          onClick={handleSaveAsTemplate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Save as Template
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedTemplateId('');
        }}
        title="Select Template"
      >
        <div className="space-y-4">
          <Select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            options={[
              { value: '', label: 'Select a template...' },
              ...templates.map(t => ({
                value: t.id,
                label: `${t.name} - ${t.description}`,
              })),
            ]}
          />
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSelectedTemplateId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedTemplateId}
            >
              Use Template
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

