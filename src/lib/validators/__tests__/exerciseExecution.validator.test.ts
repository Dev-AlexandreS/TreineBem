import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateExerciseExecution } from '../exerciseExecution.validator';

/** Valid base execution data used to isolate individual fields under test */
const validBase = {
  id: 'exec-1',
  date: '2024-01-15',
  exerciseId: 'ex-1',
  exerciseName: 'Supino',
  setsCompleted: 3,
  repsCompleted: 10,
  completed: true,
};

describe('validateExerciseExecution — unit tests', () => {
  it('accepts a fully valid execution', () => {
    const result = validateExerciseExecution(validBase);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('accepts valid execution with optional fields', () => {
    const result = validateExerciseExecution({
      ...validBase,
      weightUsed: 80,
      notes: 'Boa execução',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  // ── setsCompleted ──────────────────────────────────────────────────────────

  it('accepts setsCompleted = 0 (lower boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, setsCompleted: 0 });
    expect(result.errors).not.toHaveProperty('setsCompleted');
  });

  it('accepts setsCompleted = 20 (upper boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, setsCompleted: 20 });
    expect(result.errors).not.toHaveProperty('setsCompleted');
  });

  it('rejects setsCompleted = -1 (below lower boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, setsCompleted: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('setsCompleted');
  });

  it('rejects setsCompleted = 21 (above upper boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, setsCompleted: 21 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('setsCompleted');
  });

  it('rejects setsCompleted = 1.5 (non-integer)', () => {
    const result = validateExerciseExecution({ ...validBase, setsCompleted: 1.5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('setsCompleted');
  });

  it('rejects missing setsCompleted', () => {
    const { setsCompleted: _, ...rest } = validBase;
    const result = validateExerciseExecution(rest);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('setsCompleted');
  });

  // ── repsCompleted ──────────────────────────────────────────────────────────

  it('accepts repsCompleted = 0 (lower boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, repsCompleted: 0 });
    expect(result.errors).not.toHaveProperty('repsCompleted');
  });

  it('accepts repsCompleted = 100 (upper boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, repsCompleted: 100 });
    expect(result.errors).not.toHaveProperty('repsCompleted');
  });

  it('rejects repsCompleted = -1 (below lower boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, repsCompleted: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('repsCompleted');
  });

  it('rejects repsCompleted = 101 (above upper boundary)', () => {
    const result = validateExerciseExecution({ ...validBase, repsCompleted: 101 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('repsCompleted');
  });

  it('rejects repsCompleted = 5.5 (non-integer)', () => {
    const result = validateExerciseExecution({ ...validBase, repsCompleted: 5.5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('repsCompleted');
  });

  it('rejects missing repsCompleted', () => {
    const { repsCompleted: _, ...rest } = validBase;
    const result = validateExerciseExecution(rest);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('repsCompleted');
  });

  // ── required presence fields ───────────────────────────────────────────────

  it('rejects missing id', () => {
    const { id: _, ...rest } = validBase;
    const result = validateExerciseExecution(rest);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('id');
  });

  it('rejects missing date', () => {
    const { date: _, ...rest } = validBase;
    const result = validateExerciseExecution(rest);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('date');
  });

  it('rejects missing exerciseId', () => {
    const { exerciseId: _, ...rest } = validBase;
    const result = validateExerciseExecution(rest);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('exerciseId');
  });

  it('rejects missing exerciseName', () => {
    const { exerciseName: _, ...rest } = validBase;
    const result = validateExerciseExecution(rest);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('exerciseName');
  });

  it('rejects missing completed', () => {
    const { completed: _, ...rest } = validBase;
    const result = validateExerciseExecution(rest);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('completed');
  });
});

describe('validateExerciseExecution — property-based tests', () => {
  /**
   * Property: Validator rejeita setsCompleted fora do intervalo [0, 20]
   * Validates: Requirements 6.3
   */
  describe('setsCompleted validation', () => {
    it('rejects any integer outside [0, 20]', () => {
      fc.assert(
        fc.property(
          fc.integer().filter((n) => n < 0 || n > 20),
          (invalidSets) => {
            const result = validateExerciseExecution({
              ...validBase,
              setsCompleted: invalidSets,
            });
            expect(result.errors).toHaveProperty('setsCompleted');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('accepts any integer inside [0, 20]', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 20 }), (validSets) => {
          const result = validateExerciseExecution({
            ...validBase,
            setsCompleted: validSets,
          });
          expect(result.errors).not.toHaveProperty('setsCompleted');
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property: Validator rejeita repsCompleted fora do intervalo [0, 100]
   * Validates: Requirements 6.4
   */
  describe('repsCompleted validation', () => {
    it('rejects any integer outside [0, 100]', () => {
      fc.assert(
        fc.property(
          fc.integer().filter((n) => n < 0 || n > 100),
          (invalidReps) => {
            const result = validateExerciseExecution({
              ...validBase,
              repsCompleted: invalidReps,
            });
            expect(result.errors).toHaveProperty('repsCompleted');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('accepts any integer inside [0, 100]', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (validReps) => {
          const result = validateExerciseExecution({
            ...validBase,
            repsCompleted: validReps,
          });
          expect(result.errors).not.toHaveProperty('repsCompleted');
        }),
        { numRuns: 100 },
      );
    });
  });
});
