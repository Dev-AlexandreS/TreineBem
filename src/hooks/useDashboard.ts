'use client';

import { useState, useEffect } from 'react';
import { storageService } from '@/lib/storage/storage.service';
import {
  calculateStreak,
  calculateWeeklyCompletionRate,
  calculateAverageWater,
  calculateWeightLost,
} from '@/lib/calculators';
import type {
  DailyLog,
  DayOfWeek,
  DayPlan,
  DayType,
  Goals,
  StorageError,
  WeeklyPlan,
} from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the Monday of the current week at midnight local time.
 * Sunday is treated as the last day of the previous week (offset -6).
 */
function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday;
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

/** Returns today's date as an ISO 8601 string (YYYY-MM-DD). */
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook that aggregates all data needed for the dashboard view.
 *
 * On mount it loads goals, all daily logs (from 2020-01-01 to today), and the
 * weekly plan, then derives the computed metrics exposed to the consumer.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */
export function useDashboard(): {
  currentWeight: number | null;
  targetWeight: number | null;
  weightLost: number | null;
  streak: number;
  weeklyCompletionRate: number;
  averageWater: number;
  todayPlan: DayPlan | null;
  todayDayType: DayType | null;
  allLogs: DailyLog[];
  weeklyPlan: WeeklyPlan | null;
  goals: Goals | null;
  isLoading: boolean;
  error: StorageError | null;
} {
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<StorageError | null>(null);

  // ── Load on mount ─────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const today = getTodayDate();

      const loadedGoals = storageService.getGoals();
      const loadedPlan = storageService.getWeeklyPlan();
      const loadedLogs = storageService.getDailyLogs('2020-01-01', today);

      setGoals(loadedGoals);
      setWeeklyPlan(loadedPlan);
      setAllLogs(loadedLogs);
    } catch (err) {
      setError(err as StorageError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────────

  /**
   * Weight from the log with the most recent date that has `weight` defined.
   * Requirements: 1.2
   */
  const currentWeight: number | null = (() => {
    const logsWithWeight = allLogs
      .filter((log) => log.weight !== undefined && log.weight !== null)
      .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

    return logsWithWeight.length > 0 ? (logsWithWeight[0].weight as number) : null;
  })();

  /** Target weight from goals. Requirements: 1.3 */
  const targetWeight: number | null = goals?.targetWeight ?? null;

  /**
   * Weight lost = initialWeight - currentWeight (positive means lost weight).
   * Only computed when both initialWeight (from goals) and currentWeight are available.
   * Requirements: 1.4
   */
  const weightLost: number | null =
    goals !== null && goals.initialWeight !== undefined && currentWeight !== null
      ? calculateWeightLost(goals.initialWeight, currentWeight)
      : null;

  /** Consecutive days with a log entry ending at today (or yesterday). Requirements: 1.5 */
  const streak: number = calculateStreak(allLogs);

  /**
   * Fraction of planned training days completed this week.
   * Requirements: 1.6
   */
  const weeklyCompletionRate: number =
    weeklyPlan !== null
      ? calculateWeeklyCompletionRate(allLogs, weeklyPlan, getMondayOfCurrentWeek())
      : 0;

  /** Average water intake over the last 7 days. Requirements: 1.7 */
  const averageWater: number = calculateAverageWater(allLogs, 7);

  /** The DayPlan for today from the weekly plan. Requirements: 1.8 */
  const todayPlan: DayPlan | null =
    weeklyPlan !== null ? weeklyPlan[getDayOfWeek()] : null;

  /** The dayType for today. Requirements: 1.9 */
  const todayDayType: DayType | null = todayPlan?.dayType ?? null;

  return {
    currentWeight,
    targetWeight,
    weightLost,
    streak,
    weeklyCompletionRate,
    averageWater,
    todayPlan,
    todayDayType,
    allLogs,
    weeklyPlan,
    goals,
    isLoading,
    error,
  };
}
