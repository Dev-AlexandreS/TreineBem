'use client';

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@/lib/storage/storage.service';
import { validator } from '@/lib/validators';
import type { Goals, StorageError } from '@/types';

/**
 * Hook for managing fitness goals.
 *
 * Loads Goals from storage on mount. Exposes a `saveGoals` mutation that
 * validates the data before persisting, and a `clearValidationErrors` helper
 * to reset field-level errors.
 *
 * Requirements: 8.7, 8.8
 */
export function useGoals(): {
  goals: Goals | null;
  validationErrors: Record<string, string>;
  error: StorageError | null;
  saveGoals: (goals: Partial<Goals>) => boolean;
  clearValidationErrors: () => void;
} {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<StorageError | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = storageService.getGoals();
      setGoals(stored);
    } catch (err) {
      setError(err as StorageError);
    }
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  /**
   * Validates and persists goals.
   * Returns true on success; sets validationErrors and returns false on failure.
   *
   * Requirements: 8.7, 8.8
   */
  const saveGoals = useCallback((data: Partial<Goals>): boolean => {
    const result = validator.validateGoals(data);

    if (!result.valid) {
      setValidationErrors(result.errors);
      return false;
    }

    setValidationErrors({});

    try {
      storageService.saveGoals(data as Goals);
      setGoals(data as Goals);
    } catch (err) {
      setError(err as StorageError);
    }

    return true;
  }, []);

  // ── Utilities ─────────────────────────────────────────────────────────────────

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    goals,
    validationErrors,
    error,
    saveGoals,
    clearValidationErrors,
  };
}
