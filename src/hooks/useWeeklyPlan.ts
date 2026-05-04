'use client';

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@/lib/storage/storage.service';
import { validator } from '@/lib/validators';
import type {
  DayOfWeek,
  DayType,
  Exercise,
  StorageError,
  WeeklyPlan,
} from '@/types';

/**
 * Hook for managing the weekly training plan.
 *
 * Loads the plan from storage on mount and exposes mutation helpers that
 * validate input before persisting. After each mutation the plan is reloaded
 * from storage so the in-memory state always reflects the persisted state.
 *
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */
export function useWeeklyPlan(): {
  weeklyPlan: WeeklyPlan | null;
  validationErrors: Record<string, string>;
  error: StorageError | null;
  addExercise: (dayOfWeek: DayOfWeek, exercise: Partial<Exercise>) => boolean;
  updateExercise: (dayOfWeek: DayOfWeek, exercise: Partial<Exercise>) => boolean;
  removeExercise: (dayOfWeek: DayOfWeek, exerciseId: string) => void;
  reorderExercises: (dayOfWeek: DayOfWeek, orderedIds: string[]) => void;
  setDayType: (dayOfWeek: DayOfWeek, dayType: DayType) => void;
  clearValidationErrors: () => void;
} {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<StorageError | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Reload the plan from storage and update state. */
  const reloadPlan = useCallback(() => {
    try {
      const plan = storageService.getWeeklyPlan();
      setWeeklyPlan(plan);
    } catch (err) {
      setError(err as StorageError);
    }
  }, []);

  // ── Mount ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    reloadPlan();
  }, [reloadPlan]);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  /**
   * Validates and adds an exercise to the given day.
   * Returns true on success; sets validationErrors and returns false on failure.
   *
   * Requirements: 2.4
   */
  const addExercise = useCallback(
    (dayOfWeek: DayOfWeek, exercise: Partial<Exercise>): boolean => {
      const result = validator.validateExercise(exercise);

      if (!result.valid) {
        setValidationErrors(result.errors);
        return false;
      }

      setValidationErrors({});

      try {
        storageService.addExercise(dayOfWeek, exercise as Exercise);
        reloadPlan();
      } catch (err) {
        setError(err as StorageError);
      }

      return true;
    },
    [reloadPlan]
  );

  /**
   * Validates and updates an existing exercise on the given day.
   * Returns true on success; sets validationErrors and returns false on failure.
   *
   * Requirements: 2.5
   */
  const updateExercise = useCallback(
    (dayOfWeek: DayOfWeek, exercise: Partial<Exercise>): boolean => {
      const result = validator.validateExercise(exercise);

      if (!result.valid) {
        setValidationErrors(result.errors);
        return false;
      }

      setValidationErrors({});

      try {
        storageService.updateExercise(dayOfWeek, exercise as Exercise);
        reloadPlan();
      } catch (err) {
        setError(err as StorageError);
      }

      return true;
    },
    [reloadPlan]
  );

  /**
   * Removes an exercise from the given day. No validation required.
   *
   * Requirements: 2.6, 2.7
   */
  const removeExercise = useCallback(
    (dayOfWeek: DayOfWeek, exerciseId: string): void => {
      try {
        storageService.removeExercise(dayOfWeek, exerciseId);
        reloadPlan();
      } catch (err) {
        setError(err as StorageError);
      }
    },
    [reloadPlan]
  );

  /**
   * Reorders exercises within a day. No validation required.
   *
   * Requirements: 2.8
   */
  const reorderExercises = useCallback(
    (dayOfWeek: DayOfWeek, orderedIds: string[]): void => {
      try {
        storageService.reorderExercises(dayOfWeek, orderedIds);
        reloadPlan();
      } catch (err) {
        setError(err as StorageError);
      }
    },
    [reloadPlan]
  );

  /**
   * Sets the day type for the given day.
   * When the type is 'rest', all exercises for that day are cleared.
   *
   * Requirements: 2.9, 2.10
   */
  const setDayType = useCallback(
    (dayOfWeek: DayOfWeek, dayType: DayType): void => {
      try {
        const plan = storageService.getWeeklyPlan();
        plan[dayOfWeek].dayType = dayType;

        if (dayType === 'rest') {
          plan[dayOfWeek].exercises = [];
        }

        storageService.saveWeeklyPlan(plan);
        reloadPlan();
      } catch (err) {
        setError(err as StorageError);
      }
    },
    [reloadPlan]
  );

  // ── Utilities ─────────────────────────────────────────────────────────────────

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    weeklyPlan,
    validationErrors,
    error,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
    setDayType,
    clearValidationErrors,
  };
}
