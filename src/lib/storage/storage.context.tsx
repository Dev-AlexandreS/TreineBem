'use client';

import { createContext } from 'react';
import type { StorageService, StorageError } from '@/types';

export const StorageContext = createContext<{
  service: StorageService;
  isLoading: boolean;
  error: StorageError | null;
  clearError: () => void;
} | null>(null);
