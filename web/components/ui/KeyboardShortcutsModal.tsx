'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { X } from 'lucide-react';

interface Shortcut {
  key: string;
  modifiers?: string;
  description: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-4">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {shortcut.modifiers && (
                <>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    {shortcut.modifiers}
                  </kbd>
                  <span className="text-gray-400 dark:text-gray-500">+</span>
                </>
              )}
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

