'use client';

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@/lib/storage/storage.service';
import { validator } from '@/lib/validators';
import type {
  DayOfWeek,
  DayPlan,
  Exercise,
  ExerciseExecution,
  ISODateString,
  StorageError,
} from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date as an ISO 8601 string (YYYY-MM-DD). */
function getTodayDate(): ISODateString {
  return new Date().toISOString().split('T')[0];
}

/**
 * Maps a JS Date.getDay() value (0–6) to a DayOfWeek string.
 * 0 = Sunday, 1 = Monday, …, 6 = Saturday.
 */
function getDayOfWeek(): DayOfWeek {
  const map: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return map[new Date().getDay()];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook for managing today's workout session.
 *
 * On mount it loads:
 *  - The DayPlan for today from the weekly plan.
 *  - Any existing ExerciseExecutions already saved for today.
 *
 * Exposes helpers to record individual exercise executions and to finalise the
 * workout, which marks today's DailyLog as trained and followedPlan.
 *
 * Requirements: 5.2, 5.3, 5.7, 5.8
 */
export function useWorkout(): {
  todayPlan: DayPlan | null;
  exercises: Exercise[];
  executions: ExerciseExecution[];
  validationErrors: Record<string, string>;
  error: StorageError | null;
  saveExecution: (execution: Partial<ExerciseExecution>) => boolean;
  finalizeWorkout: () => void;
  clearValidationErrors: () => void;
} {
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [executions, setExecutions] = useState<ExerciseExecution[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<StorageError | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Reload today's executions from storage and update state. */
  const reloadExecutions = useCallback(() => {
    try {
      const today = getTodayDate();
      const stored = storageService.getExerciseExecutions(today);
      setExecutions(stored);
    } catch (err) {
      setError(err as StorageError);
    }
  }, []);

  // ── Mount ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const plan = storageService.getWeeklyPlan();
      const dayOfWeek = getDayOfWeek();
      const dayPlan = plan[dayOfWeek];

      setTodayPlan(dayPlan);
      setExercises(dayPlan.exercises);
    } catch (err) {
      setError(err as StorageError);
    }

    reloadExecutions();
  }, [reloadExecutions]);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  /**
   * Validates and persists a single exercise execution for today.
   * Returns true on success; sets validationErrors and returns false on failure.
   *
   * Requirements: 5.2, 5.3
   */
  const saveExecution = useCallback(
    (execution: Partial<ExerciseExecution>): boolean => {
      const result = validator.validateExerciseExecution(execution);

      if (!result.valid) {
        setValidationErrors(result.errors);
        return false;
      }

      setValidationErrors({});

      try {
        storageService.saveExerciseExecution(execution as ExerciseExecution);
        reloadExecutions();
      } catch (err) {
        setError(err as StorageError);
      }

      return true;
    },
    [reloadExecutions]
  );

  /**
   * Finalises the workout for today.
   *
   * Persists all current executions (no-op if already saved) and upserts
   * today's DailyLog with `trained: true` and `followedPlan: true`.
   * If no DailyLog exists for today a new one is created with sensible defaults.
   *
   * Requirements: 5.7, 5.8
   */
  const finalizeWorkout = useCallback((): void => {
    try {
      const today = getTodayDate();

      // Persist any in-memory executions that haven't been saved yet
      const currentExecutions = storageService.getExerciseExecutions(today);
      for (const execution of executions) {
        const alreadySaved = currentExecutions.some((e) => e.id === execution.id);
        if (!alreadySaved) {
          storageService.saveExerciseExecution(execution);
        }
      }

      // Upsert today's DailyLog
      const existingLog = storageService.getDailyLog(today);

      const updatedLog = existingLog
        ? { ...existingLog, trained: true, followedPlan: true }
        : {
            date: today,
            trained: true,
            followedPlan: true,
            didSomethingDifferent: false,
          };

      storageService.saveDailyLog(updatedLog);
    } catch (err) {
      setError(err as StorageError);
    }
  }, [executions]);

  // ── Utilities ─────────────────────────────────────────────────────────────────

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    todayPlan,
    exercises,
    executions,
    validationErrors,
    error,
    saveExecution,
    finalizeWorkout,
    clearValidationErrors,
  };
}
