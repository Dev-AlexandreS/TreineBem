import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateDailyLog } from '../dailyLog.validator';

// Feature: fitness-tracker, Property 3: Validator rejeita campos de peso fora do intervalo [30.0, 300.0]
// Feature: fitness-tracker, Property 7: Validator rejeita consumo de água fora do intervalo [0.0, 10.0]

/** Valid base daily log data used to isolate individual fields under test */
const validBase = {
  date: '2024-01-15',
  trained: true,
  followedPlan: true,
  didSomethingDifferent: false,
};

describe('validateDailyLog — unit tests', () => {
  describe('date validation', () => {
    it('reports error when date is missing', () => {
      const result = validateDailyLog({ ...validBase, date: undefined });
      expect(result.errors).toHaveProperty('date');
      expect(result.valid).toBe(false);
    });

    it('accepts a valid ISO date string', () => {
      const result = validateDailyLog(validBase);
      expect(result.errors).not.toHaveProperty('date');
    });
  });

  describe('weight validation', () => {
    it('accepts when weight is absent (optional field)', () => {
      const result = validateDailyLog({ ...validBase });
      expect(result.errors).not.toHaveProperty('weight');
    });

    it('accepts weight at lower boundary (30.0)', () => {
      const result = validateDailyLog({ ...validBase, weight: 30.0 });
      expect(result.errors).not.toHaveProperty('weight');
    });

    it('accepts weight at upper boundary (300.0)', () => {
      const result = validateDailyLog({ ...validBase, weight: 300.0 });
      expect(result.errors).not.toHaveProperty('weight');
    });

    it('rejects weight below 30.0', () => {
      const result = validateDailyLog({ ...validBase, weight: 29.9 });
      expect(result.errors).toHaveProperty('weight');
      expect(result.valid).toBe(false);
    });

    it('rejects weight above 300.0', () => {
      const result = validateDailyLog({ ...validBase, weight: 300.1 });
      expect(result.errors).toHaveProperty('weight');
      expect(result.valid).toBe(false);
    });
  });

  describe('waterLiters validation', () => {
    it('accepts when waterLiters is absent (optional field)', () => {
      const result = validateDailyLog({ ...validBase });
      expect(result.errors).not.toHaveProperty('waterLiters');
    });

    it('accepts waterLiters at lower boundary (0.0)', () => {
      const result = validateDailyLog({ ...validBase, waterLiters: 0.0 });
      expect(result.errors).not.toHaveProperty('waterLiters');
    });

    it('accepts waterLiters at upper boundary (10.0)', () => {
      const result = validateDailyLog({ ...validBase, waterLiters: 10.0 });
      expect(result.errors).not.toHaveProperty('waterLiters');
    });

    it('rejects waterLiters below 0.0', () => {
      const result = validateDailyLog({ ...validBase, waterLiters: -0.1 });
      expect(result.errors).toHaveProperty('waterLiters');
      expect(result.valid).toBe(false);
    });

    it('rejects waterLiters above 10.0', () => {
      const result = validateDailyLog({ ...validBase, waterLiters: 10.1 });
      expect(result.errors).toHaveProperty('waterLiters');
      expect(result.valid).toBe(false);
    });
  });

  describe('boolean fields validation', () => {
    it('reports error when trained is missing', () => {
      const result = validateDailyLog({ ...validBase, trained: undefined });
      expect(result.errors).toHaveProperty('trained');
      expect(result.valid).toBe(false);
    });

    it('reports error when followedPlan is missing', () => {
      const result = validateDailyLog({ ...validBase, followedPlan: undefined });
      expect(result.errors).toHaveProperty('followedPlan');
      expect(result.valid).toBe(false);
    });

    it('reports error when didSomethingDifferent is missing', () => {
      const result = validateDailyLog({ ...validBase, didSomethingDifferent: undefined });
      expect(result.errors).toHaveProperty('didSomethingDifferent');
      expect(result.valid).toBe(false);
    });

    it('accepts all boolean fields as true', () => {
      const result = validateDailyLog({ ...validBase, trained: true, followedPlan: true, didSomethingDifferent: true });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('accepts all boolean fields as false', () => {
      const result = validateDailyLog({ ...validBase, trained: false, followedPlan: false, didSomethingDifferent: false });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('full valid log', () => {
    it('returns valid with no errors for a complete valid log', () => {
      const result = validateDailyLog({
        date: '2024-06-01',
        weight: 85.5,
        waterLiters: 2.5,
        trained: true,
        followedPlan: true,
        didSomethingDifferent: false,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});

describe('validateDailyLog — property-based tests', () => {
  /**
   * Property 3: Validator rejeita campos de peso fora do intervalo [30.0, 300.0]
   * Validates: Requirements 4.4
   */
  describe('Property 3: weight validation', () => {
    it('rejects any weight outside [30.0, 300.0]', () => {
      fc.assert(
        fc.property(
          fc.float({ noNaN: true }).filter((n) => n < 30.0 || n > 300.0),
          (invalidWeight) => {
            const result = validateDailyLog({ ...validBase, weight: invalidWeight });
            expect(result.errors).toHaveProperty('weight');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('accepts any weight inside [30.0, 300.0]', () => {
      fc.assert(
        fc.property(fc.float({ min: 30.0, max: 300.0, noNaN: true }), (validWeight) => {
          const result = validateDailyLog({ ...validBase, weight: validWeight });
          expect(result.errors).not.toHaveProperty('weight');
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: Validator rejeita consumo de água fora do intervalo [0.0, 10.0]
   * Validates: Requirements 4.5
   */
  describe('Property 7: waterLiters validation', () => {
    it('rejects any waterLiters outside [0.0, 10.0]', () => {
      fc.assert(
        fc.property(
          fc.float({ noNaN: true }).filter((n) => n < 0.0 || n > 10.0),
          (invalidWater) => {
            const result = validateDailyLog({ ...validBase, waterLiters: invalidWater });
            expect(result.errors).toHaveProperty('waterLiters');
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('accepts any waterLiters inside [0.0, 10.0]', () => {
      fc.assert(
        fc.property(fc.float({ min: 0.0, max: 10.0, noNaN: true }), (validWater) => {
          const result = validateDailyLog({ ...validBase, waterLiters: validWater });
          expect(result.errors).not.toHaveProperty('waterLiters');
        }),
        { numRuns: 100 },
      );
    });
  });
});
