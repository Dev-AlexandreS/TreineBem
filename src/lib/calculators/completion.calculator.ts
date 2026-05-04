import type { DailyLog, WeeklyPlan, DayOfWeek } from '@/types';

/** Maps each DayOfWeek to its offset (in days) from the week's Monday. */
const DAY_OFFSET: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

/** Formats a Date as "YYYY-MM-DD" using local time. */
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the weekly training completion rate.
 *
 * Definition:
 *   result = (days with training done) / (days with training planned)
 *
 * - "Days with training planned" = days in the week where `dayType` is 'workout' or 'fight'.
 * - "Days with training done"    = days in the week where a DailyLog exists with `trained: true`.
 * - The week spans 7 days starting from `weekStart` (Monday = offset 0, Sunday = offset 6).
 * - If there are no planned training days, returns 0.0 to avoid division by zero.
 * - The result is always clamped to [0.0, 1.0].
 *
 * @param logs      - Array of DailyLog entries (order does not matter).
 * @param plan      - The WeeklyPlan mapping each DayOfWeek to its DayPlan.
 * @param weekStart - The Monday of the target week (time component is ignored).
 * @returns A number in [0.0, 1.0] representing the completion rate.
 */
export function calculateWeeklyCompletionRate(
  logs: DailyLog[],
  plan: WeeklyPlan,
  weekStart: Date,
): number {
  // Build a Set of dates that have a log with trained: true for O(1) lookup
  const trainedDates = new Set(
    logs.filter((log) => log.trained).map((log) => log.date),
  );

  // Normalise weekStart to midnight local time
  const monday = new Date(weekStart);
  monday.setHours(0, 0, 0, 0);

  let plannedDays = 0;
  let doneDays = 0;

  for (const [day, offset] of Object.entries(DAY_OFFSET) as [DayOfWeek, number][]) {
    const dayPlan = plan[day];

    // Count as planned if dayType is 'workout' or 'fight'
    if (dayPlan.dayType === 'workout' || dayPlan.dayType === 'fight') {
      plannedDays++;

      // Compute the ISO date for this day of the week
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      const isoDate = toISODate(date);

      if (trainedDates.has(isoDate)) {
        doneDays++;
      }
    }
  }

  // Avoid division by zero
  if (plannedDays === 0) return 0.0;

  // Clamp to [0.0, 1.0] as a safety measure (doneDays should never exceed plannedDays,
  // but logs could theoretically contain extra entries)
  return Math.min(1.0, Math.max(0.0, doneDays / plannedDays));
}
