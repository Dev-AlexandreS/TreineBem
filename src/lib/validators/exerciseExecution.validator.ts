import type { ExerciseExecution, ValidationResult } from '@/types';

/**
 * Validates a Partial<ExerciseExecution> and returns a ValidationResult.
 *
 * Required fields (presence check): id, date, exerciseId, exerciseName, completed.
 * Required fields (range check):
 *  - setsCompleted: integer between 0 and 20 inclusive (Requirement 6.3)
 *  - repsCompleted: integer between 0 and 100 inclusive (Requirement 6.4)
 * Optional fields (no validation): weightUsed, notes.
 *
 * Requirements: 6.3, 6.4
 */
export function validateExerciseExecution(
  data: Partial<ExerciseExecution>,
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate id — required, presence only
  if (data.id === undefined || data.id === null) {
    errors.id = 'O id é obrigatório.';
  }

  // Validate date — required, presence only
  if (data.date === undefined || data.date === null || data.date === '') {
    errors.date = 'A data é obrigatória.';
  }

  // Validate exerciseId — required, presence only
  if (data.exerciseId === undefined || data.exerciseId === null) {
    errors.exerciseId = 'O id do exercício é obrigatório.';
  }

  // Validate exerciseName — required, presence only
  if (data.exerciseName === undefined || data.exerciseName === null) {
    errors.exerciseName = 'O nome do exercício é obrigatório.';
  }

  // Validate completed — required, presence only
  if (data.completed === undefined || data.completed === null) {
    errors.completed = 'O campo "concluído" é obrigatório.';
  }

  // Validate setsCompleted — required, integer between 0 and 20 inclusive (Requirement 6.3)
  if (data.setsCompleted === undefined || data.setsCompleted === null) {
    errors.setsCompleted = 'O número de séries realizadas é obrigatório.';
  } else if (
    !Number.isInteger(data.setsCompleted) ||
    data.setsCompleted < 0 ||
    data.setsCompleted > 20
  ) {
    errors.setsCompleted =
      'As séries realizadas devem ser um número inteiro entre 0 e 20.';
  }

  // Validate repsCompleted — required, integer between 0 and 100 inclusive (Requirement 6.4)
  if (data.repsCompleted === undefined || data.repsCompleted === null) {
    errors.repsCompleted = 'O número de repetições realizadas é obrigatório.';
  } else if (
    !Number.isInteger(data.repsCompleted) ||
    data.repsCompleted < 0 ||
    data.repsCompleted > 100
  ) {
    errors.repsCompleted =
      'As repetições realizadas devem ser um número inteiro entre 0 e 100.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
