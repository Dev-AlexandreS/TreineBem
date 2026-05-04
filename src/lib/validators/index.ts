export type { Validator } from '@/types';

export { validateExercise } from './exercise.validator';
export { validateDailyLog } from './dailyLog.validator';
export { validateGoals } from './goals.validator';
export { validateExerciseExecution } from './exerciseExecution.validator';
export { validateHeight, validateCheckinWeight, validateCheckinWater } from './settings.validator';
export type { FieldValidationResult } from './settings.validator';

import { validateExercise } from './exercise.validator';
import { validateDailyLog } from './dailyLog.validator';
import { validateGoals } from './goals.validator';
import { validateExerciseExecution } from './exerciseExecution.validator';
import type { Validator } from '@/types';

/**
 * Singleton object implementing the Validator interface.
 * Aggregates all individual validator functions into a unified API.
 *
 * Requirements: 3.9, 6.9
 */
export const validator: Validator = {
  validateExercise,
  validateDailyLog,
  validateGoals,
  validateExerciseExecution,
};
