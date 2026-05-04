import type { DailyLog, ValidationResult } from '@/types';

/**
 * Validates a Partial<DailyLog> and returns a ValidationResult.
 *
 * Required fields: date, trained, followedPlan, didSomethingDifferent.
 * Optional fields: weight (30.0–300.0 kg), waterLiters (0.0–10.0 L).
 * Optional fields are only validated when present (not undefined/null).
 *
 * Requirements: 4.4, 4.5
 */
export function validateDailyLog(data: Partial<DailyLog>): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate date — required (Requirement 4.2, 4.3)
  if (data.date === undefined || data.date === null || data.date === '') {
    errors.date = 'A data é obrigatória.';
  }

  // Validate weight — optional, but if present must be a number between 30.0 and 300.0 (Requirement 4.4)
  if (data.weight !== undefined && data.weight !== null) {
    if (typeof data.weight !== 'number' || isNaN(data.weight) || data.weight < 30.0 || data.weight > 300.0) {
      errors.weight = 'O peso deve ser um número decimal entre 30,0 e 300,0 kg.';
    }
  }

  // Validate waterLiters — optional, but if present must be a number between 0.0 and 10.0 (Requirement 4.5)
  if (data.waterLiters !== undefined && data.waterLiters !== null) {
    if (typeof data.waterLiters !== 'number' || isNaN(data.waterLiters) || data.waterLiters < 0.0 || data.waterLiters > 10.0) {
      errors.waterLiters = 'O consumo de água deve ser um número decimal entre 0,0 e 10,0 litros.';
    }
  }

  // Validate trained — required boolean (Requirement 4.6)
  if (data.trained === undefined || data.trained === null) {
    errors.trained = 'O campo "Treinou hoje" é obrigatório.';
  } else if (typeof data.trained !== 'boolean') {
    errors.trained = 'O campo "Treinou hoje" deve ser verdadeiro ou falso.';
  }

  // Validate followedPlan — required boolean (Requirement 4.7)
  if (data.followedPlan === undefined || data.followedPlan === null) {
    errors.followedPlan = 'O campo "Executou treino previsto" é obrigatório.';
  } else if (typeof data.followedPlan !== 'boolean') {
    errors.followedPlan = 'O campo "Executou treino previsto" deve ser verdadeiro ou falso.';
  }

  // Validate didSomethingDifferent — required boolean (Requirement 4.8)
  if (data.didSomethingDifferent === undefined || data.didSomethingDifferent === null) {
    errors.didSomethingDifferent = 'O campo "Fez algo diferente" é obrigatório.';
  } else if (typeof data.didSomethingDifferent !== 'boolean') {
    errors.didSomethingDifferent = 'O campo "Fez algo diferente" deve ser verdadeiro ou falso.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
