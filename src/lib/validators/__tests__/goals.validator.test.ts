import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateGoals } from '../goals.validator';

/** Valid base goals data used to isolate individual fields under test */
const validBase = {
  initialWeight: 70.0,
  targetWeight: 65.0,
  dailyWaterLiters: 2.0,
  weeklyWorkouts: 4,
  weeklyCardioMinutes: 120,
};

describe('validateGoals — unit tests', () => {
  it('accepts a fully valid goals object', () => {
    const result = validateGoals(validBase);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('accepts boundary values (minimums)', () => {
    const result = validateGoals({
      initialWeight: 30.0,
      targetWeight: 30.0,
      dailyWaterLiters: 0.5,
      weeklyWorkouts: 1,
      weeklyCardioMinutes: 0,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('accepts boundary values (maximums)', () => {
    const result = validateGoals({
      initialWeight: 300.0,
      targetWeight: 300.0,
      dailyWaterLiters: 10.0,
      weeklyWorkouts: 7,
      weeklyCardioMinutes: 600,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  // initialWeight
  it('rejects missing initialWeight', () => {
    const result = validateGoals({ ...validBase, initialWeight: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('initialWeight');
  });

  it('rejects initialWeight below 30.0', () => {
    const result = validateGoals({ ...validBase, initialWeight: 29.9 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('initialWeight');
  });

  it('rejects initialWeight above 300.0', () => {
    const result = validateGoals({ ...validBase, initialWeight: 300.1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('initialWeight');
  });

  // targetWeight
  it('rejects missing targetWeight', () => {
    const result = validateGoals({ ...validBase, targetWeight: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('targetWeight');
  });

  it('rejects targetWeight below 30.0', () => {
    const result = validateGoals({ ...validBase, targetWeight: 29.9 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('targetWeight');
  });

  it('rejects targetWeight above 300.0', () => {
    const result = validateGoals({ ...validBase, targetWeight: 300.1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('targetWeight');
  });

  // dailyWaterLiters
  it('rejects missing dailyWaterLiters', () => {
    const result = validateGoals({ ...validBase, dailyWaterLiters: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('dailyWaterLiters');
  });

  it('rejects dailyWaterLiters below 0.5', () => {
    const result = validateGoals({ ...validBase, dailyWaterLiters: 0.4 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('dailyWaterLiters');
  });

  it('rejects dailyWaterLiters above 10.0', () => {
    const result = validateGoals({ ...validBase, dailyWaterLiters: 10.1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('dailyWaterLiters');
  });

  // weeklyWorkouts
  it('rejects missing weeklyWorkouts', () => {
    const result = validateGoals({ ...validBase, weeklyWorkouts: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyWorkouts');
  });

  it('rejects weeklyWorkouts below 1', () => {
    const result = validateGoals({ ...validBase, weeklyWorkouts: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyWorkouts');
  });

  it('rejects weeklyWorkouts above 7', () => {
    const result = validateGoals({ ...validBase, weeklyWorkouts: 8 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyWorkouts');
  });

  it('rejects non-integer weeklyWorkouts', () => {
    const result = validateGoals({ ...validBase, weeklyWorkouts: 3.5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyWorkouts');
  });

  // weeklyCardioMinutes
  it('rejects missing weeklyCardioMinutes', () => {
    const result = validateGoals({ ...validBase, weeklyCardioMinutes: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyCardioMinutes');
  });

  it('rejects weeklyCardioMinutes below 0', () => {
    const result = validateGoals({ ...validBase, weeklyCardioMinutes: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyCardioMinutes');
  });

  it('rejects weeklyCardioMinutes above 600', () => {
    const result = validateGoals({ ...validBase, weeklyCardioMinutes: 601 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyCardioMinutes');
  });

  it('rejects non-integer weeklyCardioMinutes', () => {
    const result = validateGoals({ ...validBase, weeklyCardioMinutes: 30.5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('weeklyCardioMinutes');
  });

  it('reports all errors when all fields are missing', () => {
    const result = validateGoals({});
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(5);
  });
});

describe('validateGoals — property-based tests', () => {
  /**
   * Property: weight fields accept any decimal in [30.0, 300.0]
   * Validates: Requirements 8.2, 8.3
   */
  describe('weight fields [30.0, 300.0]', () => {
    it('accepts any initialWeight in [30.0, 300.0]', () => {
      fc.assert(
        fc.property(fc.float({ min: 30.0, max: 300.0, noNaN: true }), (w) => {
          const result = validateGoals({ ...validBase, initialWeight: w });
          expect(result.errors).not.toHaveProperty('initialWeight');
        }),
        { numRuns: 200 },
      );
    });

    it('rejects any initialWeight outside [30.0, 300.0]', () => {
      fc.assert(
        fc.property(
          fc.float({ noNaN: true }).filter((n) => n < 30.0 || n > 300.0),
          (w) => {
            const result = validateGoals({ ...validBase, initialWeight: w });
            expect(result.errors).toHaveProperty('initialWeight');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('accepts any targetWeight in [30.0, 300.0]', () => {
      fc.assert(
        fc.property(fc.float({ min: 30.0, max: 300.0, noNaN: true }), (w) => {
          const result = validateGoals({ ...validBase, targetWeight: w });
          expect(result.errors).not.toHaveProperty('targetWeight');
        }),
        { numRuns: 200 },
      );
    });

    it('rejects any targetWeight outside [30.0, 300.0]', () => {
      fc.assert(
        fc.property(
          fc.float({ noNaN: true }).filter((n) => n < 30.0 || n > 300.0),
          (w) => {
            const result = validateGoals({ ...validBase, targetWeight: w });
            expect(result.errors).toHaveProperty('targetWeight');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  /**
   * Property: dailyWaterLiters accepts any decimal in [0.5, 10.0]
   * Validates: Requirement 8.4
   */
  describe('dailyWaterLiters [0.5, 10.0]', () => {
    it('accepts any dailyWaterLiters in [0.5, 10.0]', () => {
      fc.assert(
        fc.property(fc.float({ min: 0.5, max: 10.0, noNaN: true }), (liters) => {
          const result = validateGoals({ ...validBase, dailyWaterLiters: liters });
          expect(result.errors).not.toHaveProperty('dailyWaterLiters');
        }),
        { numRuns: 200 },
      );
    });

    it('rejects any dailyWaterLiters outside [0.5, 10.0]', () => {
      fc.assert(
        fc.property(
          fc.float({ noNaN: true }).filter((n) => n < 0.5 || n > 10.0),
          (liters) => {
            const result = validateGoals({ ...validBase, dailyWaterLiters: liters });
            expect(result.errors).toHaveProperty('dailyWaterLiters');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  /**
   * Property: weeklyWorkouts accepts any integer in [1, 7]
   * Validates: Requirement 8.5
   */
  describe('weeklyWorkouts [1, 7]', () => {
    it('accepts any integer weeklyWorkouts in [1, 7]', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 7 }), (n) => {
          const result = validateGoals({ ...validBase, weeklyWorkouts: n });
          expect(result.errors).not.toHaveProperty('weeklyWorkouts');
        }),
        { numRuns: 100 },
      );
    });

    it('rejects any integer weeklyWorkouts outside [1, 7]', () => {
      fc.assert(
        fc.property(
          fc.integer().filter((n) => n < 1 || n > 7),
          (n) => {
            const result = validateGoals({ ...validBase, weeklyWorkouts: n });
            expect(result.errors).toHaveProperty('weeklyWorkouts');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property: weeklyCardioMinutes accepts any integer in [0, 600]
   * Validates: Requirement 8.6
   */
  describe('weeklyCardioMinutes [0, 600]', () => {
    it('accepts any integer weeklyCardioMinutes in [0, 600]', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 600 }), (n) => {
          const result = validateGoals({ ...validBase, weeklyCardioMinutes: n });
          expect(result.errors).not.toHaveProperty('weeklyCardioMinutes');
        }),
        { numRuns: 100 },
      );
    });

    it('rejects any integer weeklyCardioMinutes outside [0, 600]', () => {
      fc.assert(
        fc.property(
          fc.integer().filter((n) => n < 0 || n > 600),
          (n) => {
            const result = validateGoals({ ...validBase, weeklyCardioMinutes: n });
            expect(result.errors).toHaveProperty('weeklyCardioMinutes');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
