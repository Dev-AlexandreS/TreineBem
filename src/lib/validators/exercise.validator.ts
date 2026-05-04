import type { Exercise, MuscleGroup, ValidationResult } from '@/types';

const VALID_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulder',
  'biceps',
  'triceps',
  'legs',
  'abs',
  'glutes',
  'cardio',
  'other',
];

/**
 * Validates a plannedReps value.
 * Accepts either:
 *  - A string representing an integer between 1 and 100 (e.g. "10")
 *  - A range string in the format "N–M" (em dash, not hyphen) where N and M are
 *    integers in [1, 100] and N < M (e.g. "10–12")
 */
function isValidPlannedReps(value: string): boolean {
  // Try single integer format
  const singleMatch = /^\d+$/.exec(value);
  if (singleMatch) {
    const n = parseInt(value, 10);
    return n >= 1 && n <= 100;
  }

  // Try range format "N–M" (em dash U+2013)
  const rangeMatch = /^(\d+)–(\d+)$/.exec(value);
  if (rangeMatch) {
    const n = parseInt(rangeMatch[1], 10);
    const m = parseInt(rangeMatch[2], 10);
    return n >= 1 && m <= 100 && n < m;
  }

  return false;
}

/**
 * Validates a Partial<Exercise> and returns a ValidationResult.
 *
 * Required fields: name, muscleGroup, plannedSets, plannedReps.
 * If a required field is missing/undefined, an error is reported for that field.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function validateExercise(data: Partial<Exercise>): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate name — required, minimum 2 characters (Requirement 3.1)
  if (data.name === undefined || data.name === null) {
    errors.name = 'O nome do exercício é obrigatório.';
  } else if (data.name.length < 2) {
    errors.name = 'O nome do exercício deve ter no mínimo 2 caracteres.';
  }

  // Validate muscleGroup — required, must be a valid MuscleGroup value (Requirement 3.2)
  if (data.muscleGroup === undefined || data.muscleGroup === null) {
    errors.muscleGroup = 'O grupo muscular é obrigatório.';
  } else if (!VALID_MUSCLE_GROUPS.includes(data.muscleGroup)) {
    errors.muscleGroup = 'O grupo muscular selecionado é inválido.';
  }

  // Validate plannedSets — required, integer between 1 and 20 (Requirement 3.3)
  if (data.plannedSets === undefined || data.plannedSets === null) {
    errors.plannedSets = 'O número de séries previstas é obrigatório.';
  } else if (
    !Number.isInteger(data.plannedSets) ||
    data.plannedSets < 1 ||
    data.plannedSets > 20
  ) {
    errors.plannedSets = 'As séries previstas devem ser um número inteiro entre 1 e 20.';
  }

  // Validate plannedReps — required, integer 1–100 or range "N–M" (Requirement 3.4)
  if (data.plannedReps === undefined || data.plannedReps === null) {
    errors.plannedReps = 'O número de repetições previstas é obrigatório.';
  } else if (!isValidPlannedReps(data.plannedReps)) {
    errors.plannedReps =
      'As repetições previstas devem ser um número inteiro entre 1 e 100 ou um intervalo no formato "N–M".';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
