import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { calculateAverageWater } from '../water.calculator';
import type { DailyLog } from '@/types';

// Feature: fitness-tracker, Property 13: Média de água é calculada corretamente para qualquer lista de logs

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a Date as "YYYY-MM-DD" using local time. */
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the ISO date string for today + offsetDays (negative = past). */
function dateOffset(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
}

/** Builds a minimal DailyLog for a given date with optional waterLiters. */
function makeLog(date: string, waterLiters?: number): DailyLog {
  return {
    date,
    trained: false,
    followedPlan: false,
    didSomethingDifferent: false,
    ...(waterLiters !== undefined ? { waterLiters } : {}),
  };
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Generates a DailyLog with a date within the last 99999 days and a defined
 * waterLiters value in [0.0, 10.0].
 */
const arbDailyLogWithWater = fc.record({
  date: fc
    .integer({ min: -(99999 - 1), max: 0 })
    .map((offset) => dateOffset(offset)),
  waterLiters: fc.float({ min: 0.0, max: 10.0, noNaN: true }),
  trained: fc.boolean(),
  followedPlan: fc.boolean(),
  didSomethingDifferent: fc.boolean(),
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('calculateAverageWater — unit tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 0 for an empty log list', () => {
    expect(calculateAverageWater([], 7)).toBe(0);
  });

  it('returns 0 when no logs have waterLiters defined', () => {
    const logs = [
      makeLog(dateOffset(0)),
      makeLog(dateOffset(-1)),
      makeLog(dateOffset(-2)),
    ];
    expect(calculateAverageWater(logs, 7)).toBe(0);
  });

  it('returns the single value when there is exactly one log with waterLiters', () => {
    const logs = [makeLog(dateOffset(0), 2.5)];
    expect(calculateAverageWater(logs, 7)).toBeCloseTo(2.5);
  });

  it('calculates the correct average for multiple logs with waterLiters', () => {
    const logs = [
      makeLog(dateOffset(0), 2.0),
      makeLog(dateOffset(-1), 3.0),
      makeLog(dateOffset(-2), 1.0),
    ];
    // average = (2.0 + 3.0 + 1.0) / 3 = 2.0
    expect(calculateAverageWater(logs, 7)).toBeCloseTo(2.0);
  });

  it('ignores logs without waterLiters when computing the average', () => {
    const logs = [
      makeLog(dateOffset(0), 2.0),
      makeLog(dateOffset(-1)),        // no waterLiters
      makeLog(dateOffset(-2), 4.0),
    ];
    // average = (2.0 + 4.0) / 2 = 3.0
    expect(calculateAverageWater(logs, 7)).toBeCloseTo(3.0);
  });

  it('excludes logs older than lastNDays', () => {
    const logs = [
      makeLog(dateOffset(0), 2.0),
      makeLog(dateOffset(-6), 4.0),   // within 7-day window
      makeLog(dateOffset(-7), 10.0),  // exactly 8 days ago — outside window
    ];
    // Only the first two qualify: (2.0 + 4.0) / 2 = 3.0
    expect(calculateAverageWater(logs, 7)).toBeCloseTo(3.0);
  });

  it('includes logs exactly at the boundary (today and lastNDays-1 days ago)', () => {
    const logs = [
      makeLog(dateOffset(0), 2.0),    // today — included
      makeLog(dateOffset(-6), 4.0),   // 6 days ago — included (boundary for lastNDays=7)
    ];
    expect(calculateAverageWater(logs, 7)).toBeCloseTo(3.0);
  });

  it('returns 0 when all logs are outside the date window', () => {
    const logs = [
      makeLog(dateOffset(-10), 3.0),
      makeLog(dateOffset(-20), 2.0),
    ];
    expect(calculateAverageWater(logs, 7)).toBe(0);
  });

  it('works correctly with lastNDays = 1 (today only)', () => {
    const logs = [
      makeLog(dateOffset(0), 3.0),
      makeLog(dateOffset(-1), 5.0),  // yesterday — excluded
    ];
    expect(calculateAverageWater(logs, 1)).toBeCloseTo(3.0);
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('calculateAverageWater — property-based tests', () => {
  /**
   * Property 13: Média de água é calculada corretamente para qualquer lista de logs
   * Validates: Requirements 1.7
   *
   * For any non-empty list of DailyLog with waterLiters values,
   * calculateAverageWater returns a value equal to
   *   sum(waterLiters) / count(logs with waterLiters defined)
   *
   * We use lastNDays = 99999 to effectively disable the date filter,
   * ensuring all generated logs (within the last 99999 days) are included.
   */
  it('Property 13: average equals sum(waterLiters) / count(logs with waterLiters) for any valid list', () => {
    fc.assert(
      fc.property(
        fc.array(arbDailyLogWithWater, { minLength: 1 }),
        (logs) => {
          const result = calculateAverageWater(logs, 99999);

          // All generated logs have waterLiters defined and dates within the window
          const qualifying = logs.filter(
            (log) => log.waterLiters !== undefined && log.waterLiters !== null,
          );

          if (qualifying.length === 0) {
            expect(result).toBe(0);
          } else {
            const expectedSum = qualifying.reduce(
              (sum, log) => sum + (log.waterLiters as number),
              0,
            );
            const expectedAvg = expectedSum / qualifying.length;
            expect(result).toBeCloseTo(expectedAvg, 10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 13 (edge): returns 0 for any list where no log has waterLiters defined', () => {
    const arbLogWithoutWater = fc.record({
      date: fc
        .integer({ min: -(99999 - 1), max: 0 })
        .map((offset) => dateOffset(offset)),
      trained: fc.boolean(),
      followedPlan: fc.boolean(),
      didSomethingDifferent: fc.boolean(),
    });

    fc.assert(
      fc.property(
        fc.array(arbLogWithoutWater, { minLength: 0 }),
        (logs) => {
          expect(calculateAverageWater(logs, 99999)).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
