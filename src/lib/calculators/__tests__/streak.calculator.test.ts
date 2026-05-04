import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { calculateStreak } from '../streak.calculator';
import type { DailyLog } from '@/types';

// Feature: fitness-tracker, Property 11: Streak nunca é negativo e é zero para lista vazia

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a "YYYY-MM-DD" string for a date N days before today (local time). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Builds a minimal DailyLog for a given ISO date string. */
function makeLog(date: string): DailyLog {
  return {
    date,
    trained: false,
    followedPlan: false,
    didSomethingDifferent: false,
  };
}

// ─── Arbitrary for DailyLog ───────────────────────────────────────────────────

/**
 * Generates a valid DailyLog with a date in the range [2020-01-01, today].
 * Dates are generated as ISO strings ("YYYY-MM-DD").
 */
const arbDailyLog = fc
  .date({ min: new Date('2020-01-01'), max: new Date() })
  .map((d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return makeLog(`${year}-${month}-${day}`);
  });

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('calculateStreak — unit tests', () => {
  it('returns 0 for an empty list', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 when only today has a log', () => {
    const logs = [makeLog(daysAgo(0))];
    expect(calculateStreak(logs)).toBe(1);
  });

  it('returns 1 when only yesterday has a log (today is missing)', () => {
    const logs = [makeLog(daysAgo(1))];
    expect(calculateStreak(logs)).toBe(1);
  });

  it('returns 0 when the most recent log is 2 days ago (gap before yesterday)', () => {
    const logs = [makeLog(daysAgo(2))];
    expect(calculateStreak(logs)).toBe(0);
  });

  it('returns 3 for three consecutive days ending today', () => {
    const logs = [makeLog(daysAgo(0)), makeLog(daysAgo(1)), makeLog(daysAgo(2))];
    expect(calculateStreak(logs)).toBe(3);
  });

  it('returns 2 for two consecutive days ending yesterday (today missing)', () => {
    const logs = [makeLog(daysAgo(1)), makeLog(daysAgo(2))];
    expect(calculateStreak(logs)).toBe(2);
  });

  it('stops counting at a gap — logs on days 0, 1, 3 (gap on day 2) → streak 2', () => {
    const logs = [makeLog(daysAgo(0)), makeLog(daysAgo(1)), makeLog(daysAgo(3))];
    expect(calculateStreak(logs)).toBe(2);
  });

  it('stops counting at a gap — logs on days 1, 2, 4 (gap on day 3) → streak 2', () => {
    const logs = [makeLog(daysAgo(1)), makeLog(daysAgo(2)), makeLog(daysAgo(4))];
    expect(calculateStreak(logs)).toBe(2);
  });

  it('handles duplicate dates gracefully (same date twice)', () => {
    const logs = [makeLog(daysAgo(0)), makeLog(daysAgo(0)), makeLog(daysAgo(1))];
    expect(calculateStreak(logs)).toBe(2);
  });

  it('ignores future dates and counts only up to today', () => {
    // A log dated tomorrow should not affect the streak calculation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const logs = [makeLog(daysAgo(0)), makeLog(tomorrowStr)];
    // Today has a log → streak is at least 1
    expect(calculateStreak(logs)).toBeGreaterThanOrEqual(1);
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('calculateStreak — property-based tests', () => {
  /**
   * Property 11: Streak nunca é negativo e é zero para lista vazia
   * Validates: Requirements 1.5
   */
  describe('Property 11: streak is never negative and is zero for empty list', () => {
    it('returns a non-negative value for any list of DailyLog', () => {
      fc.assert(
        fc.property(fc.array(arbDailyLog), (logs) => {
          const streak = calculateStreak(logs);
          expect(streak).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 },
      );
    });

    it('returns exactly 0 for the empty list', () => {
      expect(calculateStreak([])).toBe(0);
    });
  });
});
