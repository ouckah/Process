'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToggleSharing } from '@/hooks/useProcesses';
import { Share2, Copy, Check } from 'lucide-react';
import type { Process } from '@/types';

interface ShareButtonProps {
  process: Process;
}

export function ShareButton({ process }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const toggleSharing = useToggleSharing();

  const appUrl = window.location.origin;

  const shareUrl = process.share_id
    ? `${appUrl}/share/${process.share_id}`
    : '';

  const handleToggle = () => {
    toggleSharing.mutate(
      { id: process.id, isPublic: !process.is_public },
      {
        onSuccess: () => {
          if (!process.is_public && shareUrl) {
            // If making public, copy link
            handleCopy();
          }
        },
      }
    );
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={process.is_public ? 'primary' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={toggleSharing.isPending}
      >
        <Share2 className="w-4 h-4 mr-2" />
        {process.is_public ? 'Public' : 'Make Public'}
      </Button>
      {process.is_public && shareUrl && (
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      )}
    </div>
  );
}
