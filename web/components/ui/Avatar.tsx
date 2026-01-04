'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  discordAvatar?: string | null;
  discordId?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

export function Avatar({ 
  discordAvatar, 
  discordId, 
  username, 
  size = 'md',
  className 
}: AvatarProps) {
  // Get first letter of username for fallback
  const initial = username.charAt(0).toUpperCase();
  
  // Generate Discord avatar URL if we have both discord_id and avatar hash
  const discordAvatarUrl = discordAvatar && discordId
    ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=128`
    : null;

  if (discordAvatarUrl) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizeClasses[size], className)}>
        <Image
          src={discordAvatarUrl}
          alt={username}
          fill
          className="object-cover"
          unoptimized // Discord CDN images are already optimized
        />
      </div>
    );
  }

  // Fallback to initial letter
  return (
    <div
      className={cn(
        'rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center font-semibold flex-shrink-0',
        sizeClasses[size],
        className
      )}
      title={username}
    >
      {initial}
    </div>
  );
}

