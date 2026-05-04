/**
 * Calculates the amount of weight lost between an initial and current weight.
 *
 * @param initialWeight - The starting weight in kg
 * @param currentWeight - The current weight in kg
 * @returns The difference (initialWeight - currentWeight). Positive means weight was lost,
 *          negative means weight was gained.
 */
export function calculateWeightLost(
  initialWeight: number,
  currentWeight: number
): number {
  return initialWeight - currentWeight;
}
