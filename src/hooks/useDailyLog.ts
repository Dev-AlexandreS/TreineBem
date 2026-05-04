'use client';

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@/lib/storage/storage.service';
import { validator } from '@/lib/validators';
import type { DailyLog, ISODateString, StorageError } from '@/types';

/** Returns today's date as an ISO 8601 string (YYYY-MM-DD). */
function getTodayDate(): ISODateString {
  return new Date().toISOString().split('T')[0];
}

/**
 * Hook for managing a single day's log entry.
 *
 * Loads the DailyLog for the given date from storage on mount and whenever
 * `date` changes. Exposes a `saveDailyLog` mutation that validates the data
 * before persisting, and a `getDailyLog` helper for ad-hoc reads.
 *
 * Requirements: 4.2, 4.3, 4.10, 4.11, 4.12
 */
export function useDailyLog(date?: string): {
  dailyLog: DailyLog | null;
  validationErrors: Record<string, string>;
  error: StorageError | null;
  saveDailyLog: (log: Partial<DailyLog>) => boolean;
  getDailyLog: (date: string) => DailyLog | null;
  clearValidationErrors: () => void;
} {
  const resolvedDate = date ?? getTodayDate();

  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<StorageError | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const log = storageService.getDailyLog(resolvedDate);
      setDailyLog(log);
    } catch (err) {
      setError(err as StorageError);
    }
  }, [resolvedDate]);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  /**
   * Validates and persists a daily log entry.
   * Returns true on success; sets validationErrors and returns false on failure.
   *
   * Requirements: 4.2, 4.3, 4.10, 4.11, 4.12
   */
  const saveDailyLog = useCallback(
    (log: Partial<DailyLog>): boolean => {
      const result = validator.validateDailyLog(log);

      if (!result.valid) {
        setValidationErrors(result.errors);
        return false;
      }

      setValidationErrors({});

      try {
        storageService.saveDailyLog(log as DailyLog);
        setDailyLog(log as DailyLog);
      } catch (err) {
        setError(err as StorageError);
      }

      return true;
    },
    []
  );

  // ── Queries ───────────────────────────────────────────────────────────────────

  /**
   * Reads a daily log directly from storage for the given date.
   * Does not affect component state.
   *
   * Requirements: 4.2
   */
  const getDailyLog = useCallback((date: string): DailyLog | null => {
    try {
      return storageService.getDailyLog(date);
    } catch (err) {
      setError(err as StorageError);
      return null;
    }
  }, []);

  // ── Utilities ─────────────────────────────────────────────────────────────────

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    dailyLog,
    validationErrors,
    error,
    saveDailyLog,
    getDailyLog,
    clearValidationErrors,
  };
}
