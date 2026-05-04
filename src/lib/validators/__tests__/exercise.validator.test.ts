import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateExercise } from '../exercise.validator';

// Feature: fitness-tracker, Property 4: Validator rejeita nome de exercício com menos de 2 caracteres
// Feature: fitness-tracker, Property 5: Validator rejeita séries planejadas fora do intervalo [1, 20]

/** Valid base exercise data used to isolate individual fields under test */
const validBase = {
  muscleGroup: 'chest' as const,
  plannedSets: 5,
  plannedReps: '10',
};

describe('validateExercise — property-based tests', () => {
  /**
   * Property 4: Validator rejeita nome de exercício com menos de 2 caracteres
   * Validates: Requirements 3.1
   */
  describe('Property 4: name validation', () => {
    it('rejects any name with length < 2', () => {
      // fc.string({ maxLength: 1 }) generates strings of length 0 or 1
      fc.assert(
        fc.property(fc.string({ maxLength: 1 }), (shortName) => {
          const result = validateExercise({ ...validBase, name: shortName });
          expect(result.errors).toHaveProperty('name');
          expect(result.valid).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('accepts any name with length >= 2', () => {
      // fc.string({ minLength: 2 }) generates strings of length 2 or more
      fc.assert(
        fc.property(fc.string({ minLength: 2 }), (validName) => {
          const result = validateExercise({ ...validBase, name: validName });
          expect(result.errors).not.toHaveProperty('name');
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Validator rejeita séries planejadas fora do intervalo [1, 20]
   * Validates: Requirements 3.3
   */
  describe('Property 5: plannedSets validation', () => {
    it('rejects any integer outside [1, 20]', () => {
      fc.assert(
        fc.property(
          fc.integer().filter((n) => n < 1 || n > 20),
          (invalidSets) => {
            const result = validateExercise({
              ...validBase,
              name: 'Supino',
              plannedSets: invalidSets,
            });
            expect(result.errors).toHaveProperty('plannedSets');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('accepts any integer inside [1, 20]', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), (validSets) => {
          const result = validateExercise({
            ...validBase,
            name: 'Supino',
            plannedSets: validSets,
          });
          expect(result.errors).not.toHaveProperty('plannedSets');
        }),
        { numRuns: 100 },
      );
    });
  });
});
