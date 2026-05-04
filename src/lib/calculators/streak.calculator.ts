import type { DailyLog } from '@/types';

/**
 * Calculates the current streak of consecutive days with a DailyLog entry.
 *
 * Algorithm:
 * - Starting from today, walk backwards day by day.
 * - Count consecutive days that have a log entry.
 * - Stop as soon as a day has no log entry.
 * - If today has no log but yesterday does, start counting from yesterday.
 *
 * @param logs - Array of DailyLog entries (order does not matter).
 * @returns Number of consecutive days with a log entry ending at today (or yesterday).
 *          Returns 0 for an empty list.
 */
export function calculateStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;

  // Build a Set of dates that have a log entry for O(1) lookup
  const loggedDates = new Set(logs.map((log) => log.date));

  // Helper: format a Date as "YYYY-MM-DD" in local time
  function toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper: subtract N days from a Date (returns a new Date)
  function subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine the starting point: today if it has a log, otherwise yesterday
  let cursor: Date;
  if (loggedDates.has(toISODate(today))) {
    cursor = today;
  } else {
    cursor = subtractDays(today, 1);
    // If yesterday also has no log, streak is 0
    if (!loggedDates.has(toISODate(cursor))) {
      return 0;
    }
  }

  // Walk backwards counting consecutive logged days
  let streak = 0;
  while (loggedDates.has(toISODate(cursor))) {
    streak++;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}
