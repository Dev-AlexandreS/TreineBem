import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { DailyLog, Goals, WeeklyPlan } from '@/types';

// ─── Mock storageService ──────────────────────────────────────────────────────

vi.mock('@/lib/storage/storage.service', () => {
  const mockStorageService = {
    getGoals: vi.fn(),
    getWeeklyPlan: vi.fn(),
    getDailyLogs: vi.fn(),
    getDailyLog: vi.fn(),
    saveDailyLog: vi.fn(),
    saveWeeklyPlan: vi.fn(),
    addExercise: vi.fn(),
    updateExercise: vi.fn(),
    removeExercise: vi.fn(),
    reorderExercises: vi.fn(),
    getExerciseExecutions: vi.fn(),
    saveExerciseExecution: vi.fn(),
    saveGoals: vi.fn(),
  };

  return {
    storageService: mockStorageService,
    LocalStorageStorageService: vi.fn(),
    createStorageService: vi.fn(() => mockStorageService),
  };
});

// ─── Import after mock ────────────────────────────────────────────────────────

import { storageService } from '@/lib/storage/storage.service';
import { useDashboard } from '../useDashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Builds a minimal DailyLog for a given ISO date string. */
function makeLog(date: string, overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    date,
    trained: false,
    followedPlan: false,
    didSomethingDifferent: false,
    ...overrides,
  };
}

/** A valid WeeklyPlan where every day is 'rest' with no exercises. */
const restWeeklyPlan: WeeklyPlan = {
  monday:    { dayType: 'rest', exercises: [] },
  tuesday:   { dayType: 'rest', exercises: [] },
  wednesday: { dayType: 'rest', exercises: [] },
  thursday:  { dayType: 'rest', exercises: [] },
  friday:    { dayType: 'rest', exercises: [] },
  saturday:  { dayType: 'rest', exercises: [] },
  sunday:    { dayType: 'rest', exercises: [] },
};

const mockGoals: Goals = {
  initialWeight: 90,
  targetWeight: 80,
  dailyWaterLiters: 2.5,
  weeklyWorkouts: 4,
  weeklyCardioMinutes: 120,
};

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('useDashboard — unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks — individual tests override as needed
    vi.mocked(storageService.getGoals).mockReturnValue(mockGoals);
    vi.mocked(storageService.getWeeklyPlan).mockReturnValue(restWeeklyPlan);
    vi.mocked(storageService.getDailyLogs).mockReturnValue([]);
  });

  // ── Test 1: currentWeight from most recent log (Property 14) ─────────────────

  /**
   * Property 14: currentWeight corresponds to the most recent log with a weight value.
   * Validates: Requirements 1.2
   */
  it('currentWeight equals the weight from the most recent log', async () => {
    const logs: DailyLog[] = [
      makeLog('2024-01-01', { weight: 90.0 }),
      makeLog('2024-03-15', { weight: 85.5 }), // most recent
      makeLog('2024-02-10', { weight: 87.0 }),
    ];
    vi.mocked(storageService.getDailyLogs).mockReturnValue(logs);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // The most recent log with weight is 2024-03-15 → 85.5
    expect(result.current.currentWeight).toBe(85.5);
  });

  // ── Test 2: currentWeight is null when no logs have weight ────────────────────

  it('currentWeight is null when no logs have a weight value', async () => {
    const logs: DailyLog[] = [
      makeLog('2024-01-01'), // no weight
      makeLog('2024-02-10'), // no weight
    ];
    vi.mocked(storageService.getDailyLogs).mockReturnValue(logs);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentWeight).toBeNull();
  });

  // ── Test 3: streak is 0 when no logs exist ────────────────────────────────────

  it('streak is 0 when no logs exist', async () => {
    vi.mocked(storageService.getDailyLogs).mockReturnValue([]);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.streak).toBe(0);
  });

  // ── Test 4: todayDayType is 'rest' when today's plan is rest ─────────────────

  it("todayDayType is 'rest' when today's plan is rest", async () => {
    vi.mocked(storageService.getWeeklyPlan).mockReturnValue(restWeeklyPlan);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.todayDayType).toBe('rest');
  });
});
