import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateWeeklyCompletionRate } from '../completion.calculator';
import type { DailyLog, WeeklyPlan, DayOfWeek, DayType, MuscleGroup } from '@/types';

// Feature: fitness-tracker, Property 12: Percentual de execução semanal está sempre no intervalo [0.0, 1.0]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/** Returns the ISO date string ("YYYY-MM-DD") for a given Monday + day offset. */
function isoDateForOffset(monday: Date, offset: number): string {
  const d = new Date(monday);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Builds a minimal DailyLog for a given date and trained flag. */
function makeLog(date: string, trained: boolean): DailyLog {
  return {
    date,
    trained,
    followedPlan: false,
    didSomethingDifferent: false,
  };
}

/** Builds a WeeklyPlan where every day has the given DayType and no exercises. */
function makePlan(dayType: DayType): WeeklyPlan {
  const entry = { dayType, exercises: [] };
  return {
    monday: { ...entry },
    tuesday: { ...entry },
    wednesday: { ...entry },
    thursday: { ...entry },
    friday: { ...entry },
    saturday: { ...entry },
    sunday: { ...entry },
  };
}

/** A fixed Monday used as weekStart in unit tests. */
const WEEK_START = new Date('2024-01-01'); // Monday

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const arbDayType = fc.constantFrom<DayType>('workout', 'fight', 'rest');
const arbMuscleGroup = fc.constantFrom<MuscleGroup>(
  'chest', 'back', 'shoulder', 'biceps', 'triceps', 'legs', 'abs', 'glutes', 'cardio', 'other',
);

/** Generates a valid DailyLog with a date in [2020-01-01, 2030-12-31]. */
const arbDailyLog = fc.record({
  date: fc
    .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map((d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }),
  trained: fc.boolean(),
  followedPlan: fc.boolean(),
  didSomethingDifferent: fc.boolean(),
});

/** Generates a valid WeeklyPlan with arbitrary DayType per day. */
const arbWeeklyPlan: fc.Arbitrary<WeeklyPlan> = fc
  .tuple(...DAYS_OF_WEEK.map(() => arbDayType))
  .map(([mon, tue, wed, thu, fri, sat, sun]) => ({
    monday: { dayType: mon, exercises: [] },
    tuesday: { dayType: tue, exercises: [] },
    wednesday: { dayType: wed, exercises: [] },
    thursday: { dayType: thu, exercises: [] },
    friday: { dayType: fri, exercises: [] },
    saturday: { dayType: sat, exercises: [] },
    sunday: { dayType: sun, exercises: [] },
  }));

/** Generates a Monday date in [2020-01-06, 2030-12-29] (all Mondays). */
const arbMonday = fc
  .date({ min: new Date('2020-01-06'), max: new Date('2030-12-29') })
  .map((d) => {
    // Snap to the nearest Monday
    const day = d.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('calculateWeeklyCompletionRate — unit tests', () => {
  it('returns 0.0 when there are no planned training days (all rest)', () => {
    const plan = makePlan('rest');
    const logs: DailyLog[] = [];
    expect(calculateWeeklyCompletionRate(logs, plan, WEEK_START)).toBe(0.0);
  });

  it('returns 0.0 when there are no planned training days even with logs', () => {
    const plan = makePlan('rest');
    const logs = DAYS_OF_WEEK.map((_, i) =>
      makeLog(isoDateForOffset(WEEK_START, i), true),
    );
    expect(calculateWeeklyCompletionRate(logs, plan, WEEK_START)).toBe(0.0);
  });

  it('returns 1.0 when all planned workout days have a trained log', () => {
    const plan = makePlan('workout');
    const logs = DAYS_OF_WEEK.map((_, i) =>
      makeLog(isoDateForOffset(WEEK_START, i), true),
    );
    expect(calculateWeeklyCompletionRate(logs, plan, WEEK_START)).toBe(1.0);
  });

  it('returns 1.0 when all planned fight days have a trained log', () => {
    const plan = makePlan('fight');
    const logs = DAYS_OF_WEEK.map((_, i) =>
      makeLog(isoDateForOffset(WEEK_START, i), true),
    );
    expect(calculateWeeklyCompletionRate(logs, plan, WEEK_START)).toBe(1.0);
  });

  it('returns 0.0 when all planned days exist but trained is false', () => {
    const plan = makePlan('workout');
    const logs = DAYS_OF_WEEK.map((_, i) =>
      makeLog(isoDateForOffset(WEEK_START, i), false),
    );
    expect(calculateWeeklyCompletionRate(logs, plan, WEEK_START)).toBe(0.0);
  });

  it('returns 0.5 when 3 out of 6 planned workout days are done', () => {
    // Plan: Mon–Sat workout, Sun rest
    const plan: WeeklyPlan = {
      monday: { dayType: 'workout', exercises: [] },
      tuesday: { dayType: 'workout', exercises: [] },
      wednesday: { dayType: 'workout', exercises: [] },
      thursday: { dayType: 'workout', exercises: [] },
      friday: { dayType: 'workout', exercises: [] },
      saturday: { dayType: 'workout', exercises: [] },
      sunday: { dayType: 'rest', exercises: [] },
    };
    // Trained on Mon, Tue, Wed only
    const logs = [
      makeLog(isoDateForOffset(WEEK_START, 0), true),  // monday
      makeLog(isoDateForOffset(WEEK_START, 1), true),  // tuesday
      makeLog(isoDateForOffset(WEEK_START, 2), true),  // wednesday
      makeLog(isoDateForOffset(WEEK_START, 3), false), // thursday
      makeLog(isoDateForOffset(WEEK_START, 4), false), // friday
      makeLog(isoDateForOffset(WEEK_START, 5), false), // saturday
    ];
    expect(calculateWeeklyCompletionRate(logs, plan, WEEK_START)).toBeCloseTo(0.5);
  });

  it('returns correct ratio for a mixed workout/fight/rest plan', () => {
    // Plan: Mon=workout, Wed=fight, Fri=workout, rest on others → 3 planned
    const plan: WeeklyPlan = {
      monday: { dayType: 'workout', exercises: [] },
      tuesday: { dayType: 'rest', exercises: [] },
      wednesday: { dayType: 'fight', exercises: [] },
      thursday: { dayType: 'rest', exercises: [] },
      friday: { dayType: 'workout', exercises: [] },
      saturday: { dayType: 'rest', exercises: [] },
      sunday: { dayType: 'rest', exercises: [] },
    };
    // Trained on Mon and Wed (2 out of 3)
    const logs = [
      makeLog(isoDateForOffset(WEEK_START, 0), true),  // monday ✓
      makeLog(isoDateForOffset(WEEK_START, 2), true),  // wednesday ✓
      makeLog(isoDateForOffset(WEEK_START, 4), false), // friday ✗
    ];
    expect(calculateWeeklyCompletionRate(logs, plan, WEEK_START)).toBeCloseTo(2 / 3);
  });

  it('ignores logs from outside the target week', () => {
    const plan = makePlan('workout');
    // Logs from the previous week (7 days before weekStart)
    const prevWeekLogs = DAYS_OF_WEEK.map((_, i) =>
      makeLog(isoDateForOffset(new Date('2023-12-25'), i), true),
    );
    expect(calculateWeeklyCompletionRate(prevWeekLogs, plan, WEEK_START)).toBe(0.0);
  });

  it('returns 0.0 for an empty log list with planned days', () => {
    const plan = makePlan('workout');
    expect(calculateWeeklyCompletionRate([], plan, WEEK_START)).toBe(0.0);
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('calculateWeeklyCompletionRate — property-based tests', () => {
  /**
   * Property 12: Percentual de execução semanal está sempre no intervalo [0.0, 1.0]
   * Validates: Requirements 1.6
   */
  it('Property 12: result is always in [0.0, 1.0] for any DailyLog list and WeeklyPlan', () => {
    fc.assert(
      fc.property(
        fc.array(arbDailyLog),
        arbWeeklyPlan,
        arbMonday,
        (logs, plan, weekStart) => {
          const result = calculateWeeklyCompletionRate(logs, plan, weekStart);
          expect(result).toBeGreaterThanOrEqual(0.0);
          expect(result).toBeLessThanOrEqual(1.0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
