'use client';

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@/lib/storage/storage.service';
import {
  calculateStreak,
  calculateWeeklyCompletionRate,
  calculateAverageWater,
  calculateWeightLost,
} from '@/lib/calculators';
import { isPerfectWeek } from '@/lib/calculators/streak.calculator';
import type { DayStatus } from '@/components/dashboard/WeeklyConsistencyIndicator';
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

/** Returns a date N days ago as ISO string */
function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DOW_MAP: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekSummary {
  trainedCount: number;
  plannedCount: number;
  averageWater: number;
  weekStartWeight: number | null;
  currentWeight: number | null;
  weightDiff: number | null;
}

export interface WeekConsistencyDay {
  dayLabel: string;
  status: DayStatus;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook que agrega todos os dados necessários para o Dashboard.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 5.1, 5.5, 10.2, 10.3, 12.4
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
  todayLog: DailyLog | null;
  allLogs: DailyLog[];
  weeklyPlan: WeeklyPlan | null;
  goals: Goals | null;
  weekSummary: WeekSummary | null;
  weekConsistencyDays: WeekConsistencyDay[];
  isPerfectWeekResult: boolean;
  isLoading: boolean;
  error: StorageError | null;
  saveDailyCheckin: (weight?: number, water?: number) => Promise<void>;
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

  const currentWeight: number | null = (() => {
    const logsWithWeight = allLogs
      .filter((log) => log.weight !== undefined && log.weight !== null)
      .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
    return logsWithWeight.length > 0 ? (logsWithWeight[0].weight as number) : null;
  })();

  const targetWeight: number | null = goals?.targetWeight ?? null;

  const weightLost: number | null =
    goals !== null && goals.initialWeight !== undefined && currentWeight !== null
      ? calculateWeightLost(goals.initialWeight, currentWeight)
      : null;

  const streak: number = calculateStreak(allLogs);

  const weeklyCompletionRate: number =
    weeklyPlan !== null
      ? calculateWeeklyCompletionRate(allLogs, weeklyPlan, getMondayOfCurrentWeek())
      : 0;

  const averageWater: number = calculateAverageWater(allLogs, 7);

  const todayPlan: DayPlan | null =
    weeklyPlan !== null ? weeklyPlan[getDayOfWeek()] : null;

  const todayDayType: DayType | null = todayPlan?.dayType ?? null;

  /** Log do dia atual para pré-preencher o DailyCheckin */
  const todayLog: DailyLog | null = (() => {
    const today = getTodayDate();
    return allLogs.find((l) => l.date === today) ?? null;
  })();

  /** Resumo semanal */
  const weekSummary: WeekSummary | null = (() => {
    if (weeklyPlan === null) return null;

    const monday = getMondayOfCurrentWeek();
    const weekLogs: DailyLog[] = [];
    let plannedCount = 0;
    let trainedCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dow = DOW_MAP[d.getDay()];
      const dayPlan = weeklyPlan[dow];

      if (dayPlan.dayType !== 'rest') plannedCount++;

      const log = allLogs.find((l) => l.date === dateStr);
      if (log) {
        weekLogs.push(log);
        if (log.trained) trainedCount++;
      }
    }

    const weekAvgWater = calculateAverageWater(weekLogs, 7);

    // Peso no início da semana (log mais antigo da semana com peso)
    const weekLogsWithWeight = weekLogs
      .filter((l) => l.weight !== undefined)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const weekStartWeight = weekLogsWithWeight.length > 0
      ? (weekLogsWithWeight[0].weight as number)
      : null;

    const weightDiff =
      weekStartWeight !== null && currentWeight !== null
        ? currentWeight - weekStartWeight
        : null;

    return {
      trainedCount,
      plannedCount,
      averageWater: weekAvgWater,
      weekStartWeight,
      currentWeight,
      weightDiff,
    };
  })();

  /** Dias de consistência semanal para o WeeklyConsistencyIndicator */
  const weekConsistencyDays: WeekConsistencyDay[] = (() => {
    if (weeklyPlan === null) return [];

    const monday = getMondayOfCurrentWeek();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: WeekConsistencyDay[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dow = DOW_MAP[d.getDay()];
      const dayPlan = weeklyPlan[dow];
      const log = allLogs.find((l) => l.date === dateStr);

      let status: DayStatus;
      if (d > today) {
        status = 'future';
      } else if (dayPlan.dayType === 'rest') {
        status = 'rest';
      } else if (log?.trained) {
        status = 'trained';
      } else {
        status = 'missed';
      }

      result.push({ dayLabel: DAY_LABELS[d.getDay()], status });
    }

    return result;
  })();

  /** Semana perfeita */
  const isPerfectWeekResult: boolean = (() => {
    if (weeklyPlan === null) return false;
    return isPerfectWeek(weeklyPlan, allLogs, getMondayOfCurrentWeek());
  })();

  // ── Save daily check-in ───────────────────────────────────────────────────────

  const saveDailyCheckin = useCallback(
    async (weight?: number, water?: number): Promise<void> => {
      const today = getTodayDate();
      const existing = allLogs.find((l) => l.date === today);

      const updatedLog: DailyLog = {
        date: today,
        trained: existing?.trained ?? false,
        followedPlan: existing?.followedPlan ?? false,
        didSomethingDifferent: existing?.didSomethingDifferent ?? false,
        weight: weight !== undefined ? weight : existing?.weight,
        waterLiters: water !== undefined ? water : existing?.waterLiters,
        notes: existing?.notes,
        differentDescription: existing?.differentDescription,
      };

      storageService.saveDailyLog(updatedLog);

      // Update local state
      setAllLogs((prev) => {
        const filtered = prev.filter((l) => l.date !== today);
        return [...filtered, updatedLog];
      });
    },
    [allLogs]
  );

  return {
    currentWeight,
    targetWeight,
    weightLost,
    streak,
    weeklyCompletionRate,
    averageWater,
    todayPlan,
    todayDayType,
    todayLog,
    allLogs,
    weeklyPlan,
    goals,
    weekSummary,
    weekConsistencyDays,
    isPerfectWeekResult,
    isLoading,
    error,
    saveDailyCheckin,
  };
}
