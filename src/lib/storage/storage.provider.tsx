'use client';

import { useMemo, useState } from 'react';
import { StorageContext } from './storage.context';
import { LocalStorageStorageService } from './storage.service';
import type { StorageService, StorageError } from '@/types';

interface StorageProviderProps {
  userId: string | null;
  children: React.ReactNode;
}

/**
 * Provides a StorageService instance via StorageContext.
 *
 * Note: SupabaseAdapter is server-only and cannot be instantiated in a Client
 * Component. LocalStorageStorageService is used as the client-side service.
 * Supabase data operations are handled via Server Actions.
 *
 * Requirements: 5.5, 5.6
 */
export function StorageProvider({ userId, children }: StorageProviderProps) {
  const [error, setError] = useState<StorageError | null>(null);

  const service = useMemo<StorageService>(() => {
    // userId is available for future use (e.g. passing to Server Actions).
    // The LocalStorageStorageService is used as the client-side fallback.
    void userId;
    return new LocalStorageStorageService();
  }, [userId]);

  return (
    <StorageContext.Provider
      value={{
        service,
        isLoading: false,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}
