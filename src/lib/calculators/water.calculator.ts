import type { DailyLog, ISODateString } from '@/types';

/** Formats a Date as "YYYY-MM-DD" using local time. */
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the average daily water consumption over the last N days.
 *
 * - Only logs within the last `lastNDays` days (relative to today, inclusive) are considered.
 * - Only logs that have `waterLiters` defined (not undefined/null) contribute to the average.
 * - If no qualifying logs exist (empty list or no logs with `waterLiters`), returns 0.
 *
 * @param logs      - Array of DailyLog entries (order does not matter).
 * @param lastNDays - Number of days to look back from today (inclusive).
 * @returns The average water consumption in litres, or 0 if no data is available.
 */
export function calculateAverageWater(logs: DailyLog[], lastNDays: number): number {
  if (logs.length === 0) return 0;

  // Compute the earliest date that falls within the window
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - (lastNDays - 1));
  const cutoffISO: ISODateString = toISODate(cutoff);
  const todayISO: ISODateString = toISODate(today);

  // Filter logs within the date window that have waterLiters defined
  const qualifying = logs.filter(
    (log) =>
      log.waterLiters !== undefined &&
      log.waterLiters !== null &&
      log.date >= cutoffISO &&
      log.date <= todayISO,
  );

  if (qualifying.length === 0) return 0;

  const total = qualifying.reduce((sum, log) => sum + (log.waterLiters as number), 0);
  return total / qualifying.length;
}
