import type { Goals, ValidationResult } from '@/types';

/**
 * Validates a Partial<Goals> and returns a ValidationResult.
 *
 * All fields are required:
 *  - initialWeight: decimal between 30.0 and 300.0 kg (Requirement 8.2)
 *  - targetWeight: decimal between 30.0 and 300.0 kg (Requirement 8.3)
 *  - dailyWaterLiters: decimal between 0.5 and 10.0 L (Requirement 8.4)
 *  - weeklyWorkouts: integer between 1 and 7 (Requirement 8.5)
 *  - weeklyCardioMinutes: integer between 0 and 600 (Requirement 8.6)
 *
 * Requirements: 8.2, 8.3, 8.4, 8.5, 8.6
 */
export function validateGoals(data: Partial<Goals>): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate initialWeight — required, decimal between 30.0 and 300.0 (Requirement 8.2)
  if (data.initialWeight === undefined || data.initialWeight === null) {
    errors.initialWeight = 'O peso inicial é obrigatório.';
  } else if (
    typeof data.initialWeight !== 'number' ||
    isNaN(data.initialWeight) ||
    data.initialWeight < 30.0 ||
    data.initialWeight > 300.0
  ) {
    errors.initialWeight = 'O peso inicial deve ser um número decimal entre 30,0 e 300,0 kg.';
  }

  // Validate targetWeight — required, decimal between 30.0 and 300.0 (Requirement 8.3)
  if (data.targetWeight === undefined || data.targetWeight === null) {
    errors.targetWeight = 'O peso alvo é obrigatório.';
  } else if (
    typeof data.targetWeight !== 'number' ||
    isNaN(data.targetWeight) ||
    data.targetWeight < 30.0 ||
    data.targetWeight > 300.0
  ) {
    errors.targetWeight = 'O peso alvo deve ser um número decimal entre 30,0 e 300,0 kg.';
  }

  // Validate dailyWaterLiters — required, decimal between 0.5 and 10.0 (Requirement 8.4)
  if (data.dailyWaterLiters === undefined || data.dailyWaterLiters === null) {
    errors.dailyWaterLiters = 'O consumo diário de água é obrigatório.';
  } else if (
    typeof data.dailyWaterLiters !== 'number' ||
    isNaN(data.dailyWaterLiters) ||
    data.dailyWaterLiters < 0.5 ||
    data.dailyWaterLiters > 10.0
  ) {
    errors.dailyWaterLiters = 'O consumo diário de água deve ser um número decimal entre 0,5 e 10,0 litros.';
  }

  // Validate weeklyWorkouts — required, integer between 1 and 7 (Requirement 8.5)
  if (data.weeklyWorkouts === undefined || data.weeklyWorkouts === null) {
    errors.weeklyWorkouts = 'O número de treinos semanais é obrigatório.';
  } else if (
    !Number.isInteger(data.weeklyWorkouts) ||
    data.weeklyWorkouts < 1 ||
    data.weeklyWorkouts > 7
  ) {
    errors.weeklyWorkouts = 'Os treinos semanais devem ser um número inteiro entre 1 e 7.';
  }

  // Validate weeklyCardioMinutes — required, integer between 0 and 600 (Requirement 8.6)
  if (data.weeklyCardioMinutes === undefined || data.weeklyCardioMinutes === null) {
    errors.weeklyCardioMinutes = 'Os minutos de cardio semanais são obrigatórios.';
  } else if (
    !Number.isInteger(data.weeklyCardioMinutes) ||
    data.weeklyCardioMinutes < 0 ||
    data.weeklyCardioMinutes > 600
  ) {
    errors.weeklyCardioMinutes = 'Os minutos de cardio semanais devem ser um número inteiro entre 0 e 600.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
