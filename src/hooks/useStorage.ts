'use client';

import { useContext } from 'react';
import { StorageContext } from '@/lib/storage/storage.context';

/**
 * Returns the StorageService and related state from the nearest StorageProvider.
 * Throws if called outside of a StorageProvider tree.
 *
 * Requirements: 5.5, 8.7
 */
export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
