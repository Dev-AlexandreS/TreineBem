import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateEnv } from '../env';

const ALL_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/** Save and restore env vars around each test to avoid cross-test pollution. */
let savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  savedEnv = {};
  for (const key of ALL_VARS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ALL_VARS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe('validateEnv()', () => {
  describe('when all required variables are present', () => {
    it('does not throw', () => {
      for (const key of ALL_VARS) {
        process.env[key] = 'test-value';
      }

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('when one variable is missing', () => {
    it.each(ALL_VARS)('throws when %s is absent', (missingKey) => {
      // Set all vars except the one under test
      for (const key of ALL_VARS) {
        if (key !== missingKey) {
          process.env[key] = 'test-value';
        }
      }

      expect(() => validateEnv()).toThrow(missingKey);
    });

    it('includes the missing variable name in the error message', () => {
      // Leave DATABASE_URL unset, set the rest
      for (const key of ALL_VARS) {
        if (key !== 'DATABASE_URL') {
          process.env[key] = 'test-value';
        }
      }

      expect(() => validateEnv()).toThrow('DATABASE_URL');
    });
  });

  describe('when multiple variables are missing', () => {
    it('lists all missing variable names in the error message', () => {
      // Leave DATABASE_URL and DIRECT_URL unset
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'test-value';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-value';
      process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-value';

      let errorMessage = '';
      try {
        validateEnv();
      } catch (e) {
        errorMessage = (e as Error).message;
      }

      expect(errorMessage).toContain('DATABASE_URL');
      expect(errorMessage).toContain('DIRECT_URL');
    });

    it('throws when all variables are missing', () => {
      // All vars already deleted in beforeEach
      expect(() => validateEnv()).toThrow('Missing required environment variables');
    });

    it('error message mentions all five variables when all are absent', () => {
      let errorMessage = '';
      try {
        validateEnv();
      } catch (e) {
        errorMessage = (e as Error).message;
      }

      for (const key of ALL_VARS) {
        expect(errorMessage).toContain(key);
      }
    });
  });

  describe('error message format', () => {
    it('includes a hint to copy .env.example', () => {
      // Leave all vars unset
      let errorMessage = '';
      try {
        validateEnv();
      } catch (e) {
        errorMessage = (e as Error).message;
      }

      expect(errorMessage).toContain('.env.example');
    });

    it('formats each missing variable with a leading dash', () => {
      // Only DATABASE_URL missing
      for (const key of ALL_VARS) {
        if (key !== 'DATABASE_URL') {
          process.env[key] = 'test-value';
        }
      }

      let errorMessage = '';
      try {
        validateEnv();
      } catch (e) {
        errorMessage = (e as Error).message;
      }

      expect(errorMessage).toContain('  - DATABASE_URL');
    });
  });
});
