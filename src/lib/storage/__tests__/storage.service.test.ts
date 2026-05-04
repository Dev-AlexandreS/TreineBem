import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { createStorageService } from '../storage.service';
import type { DailyLog, Goals, WeeklyPlan } from '@/types';
import { StorageError } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clears all fitness-tracker keys from jsdom localStorage before each test. */
function clearStorage(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith('fitness-tracker:')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
}

// ─── Generators ───────────────────────────────────────────────────────────────

const arbDailyLog: fc.Arbitrary<DailyLog> = fc.record({
  date: fc
    .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() })
    .map((ts) => new Date(ts).toISOString().split('T')[0]),
  weight: fc.option(fc.float({ min: 30.0, max: 300.0, noNaN: true }), {
    nil: undefined,
  }),
  waterLiters: fc.option(fc.float({ min: 0.0, max: 10.0, noNaN: true }), {
    nil: undefined,
  }),
  trained: fc.boolean(),
  followedPlan: fc.boolean(),
  didSomethingDifferent: fc.boolean(),
});

const arbGoals: fc.Arbitrary<Goals> = fc.record({
  initialWeight: fc.float({ min: 30.0, max: 300.0, noNaN: true }),
  targetWeight: fc.float({ min: 30.0, max: 300.0, noNaN: true }),
  dailyWaterLiters: fc.float({ min: 0.5, max: 10.0, noNaN: true }),
  weeklyWorkouts: fc.integer({ min: 1, max: 7 }),
  weeklyCardioMinutes: fc.integer({ min: 0, max: 600 }),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StorageService', () => {
  beforeEach(() => {
    clearStorage();
  });

  // ── Property 1: Round-trip de persistência do Storage_Service ──────────────

  describe('Property 1: Round-trip de persistência do Storage_Service', () => {
    it('DailyLog: salvar e recuperar produz objeto equivalente ao original', () => {
      // Feature: fitness-tracker, Property 1: Round-trip de persistência do Storage_Service
      // Validates: Requirements 9.5, 9.6
      fc.assert(
        fc.property(arbDailyLog, (log) => {
          const service = createStorageService();
          service.saveDailyLog(log);
          const retrieved = service.getDailyLog(log.date);
          expect(retrieved).toEqual(log);
        }),
        { numRuns: 100 }
      );
    });

    it('Goals: salvar e recuperar produz objeto equivalente ao original', () => {
      // Feature: fitness-tracker, Property 1: Round-trip de persistência do Storage_Service
      // Validates: Requirements 9.5, 9.6
      fc.assert(
        fc.property(arbGoals, (goals) => {
          const service = createStorageService();
          service.saveGoals(goals);
          const retrieved = service.getGoals();
          expect(retrieved).toEqual(goals);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ── Property 2: Idempotência de inicialização do Storage_Service ───────────

  describe('Property 2: Idempotência de inicialização do Storage_Service', () => {
    it('getWeeklyPlan() não sobrescreve um plano já existente no storage', () => {
      // Feature: fitness-tracker, Property 2: Idempotência de inicialização do Storage_Service
      // Validates: Requirements 11.2

      // Build a minimal but valid WeeklyPlan to store as the "existing" plan.
      // We use the default plan loaded on first call, then mutate it to verify
      // that a second call does NOT revert the mutation.
      const service = createStorageService();

      // First call — triggers default-plan initialisation
      const initialPlan: WeeklyPlan = service.getWeeklyPlan();

      // Mutate the plan and persist it (simulates a user customisation)
      const customPlan: WeeklyPlan = {
        ...initialPlan,
        monday: {
          ...initialPlan.monday,
          exercises: [], // user cleared Monday exercises
        },
      };
      service.saveWeeklyPlan(customPlan);

      // Second call — must NOT overwrite the customised plan
      const retrievedPlan: WeeklyPlan = service.getWeeklyPlan();

      expect(retrievedPlan).toEqual(customPlan);
      // Specifically, Monday exercises must still be empty
      expect(retrievedPlan.monday.exercises).toHaveLength(0);
    });

    it('getWeeklyPlan() é idempotente: chamadas repetidas retornam o mesmo plano', () => {
      // Feature: fitness-tracker, Property 2: Idempotência de inicialização do Storage_Service
      // Validates: Requirements 11.2
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), (callCount) => {
          // Fresh service + fresh storage for each run
          clearStorage();
          const service = createStorageService();

          const firstResult = service.getWeeklyPlan();

          for (let i = 1; i < callCount; i++) {
            const result = service.getWeeklyPlan();
            expect(result).toEqual(firstResult);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ─── Unit Tests: Storage_Service (Task 3.5) ───────────────────────────────────

describe('StorageService – Unit Tests', () => {
  beforeEach(() => {
    clearStorage();
  });

  // ── Inicialização ──────────────────────────────────────────────────────────

  describe('Inicialização', () => {
    it('sem dados existentes: getWeeklyPlan() retorna o plano padrão com exercícios na segunda-feira', () => {
      // Validates: Requirements 9.3
      const service = createStorageService();
      const plan = service.getWeeklyPlan();

      expect(plan).toBeDefined();
      expect(plan.monday).toBeDefined();
      expect(plan.monday.exercises.length).toBeGreaterThan(0);
    });

    it('com dados existentes: getWeeklyPlan() retorna o plano salvo, não o padrão', () => {
      // Validates: Requirements 9.3
      const service = createStorageService();

      // Primeiro, obter o plano padrão para ter uma base válida
      const defaultPlan = service.getWeeklyPlan();

      // Criar um plano customizado com segunda-feira sem exercícios
      const customPlan: WeeklyPlan = {
        ...defaultPlan,
        monday: {
          dayType: 'rest',
          exercises: [],
        },
      };

      service.saveWeeklyPlan(customPlan);

      // Nova instância do serviço para garantir que não há cache em memória
      const service2 = createStorageService();
      const retrieved = service2.getWeeklyPlan();

      expect(retrieved).toEqual(customPlan);
      expect(retrieved.monday.exercises).toHaveLength(0);
      expect(retrieved.monday.dayType).toBe('rest');
    });
  });

  // ── Tratamento de JSON inválido ────────────────────────────────────────────

  describe('Tratamento de JSON inválido', () => {
    it('getDailyLog() retorna null quando o valor armazenado não é JSON válido', () => {
      // Validates: Requirements 9.5
      const date = '2024-01-15';

      // Inserir diretamente um valor corrompido no localStorage
      window.localStorage.setItem('fitness-tracker:daily-logs', 'not-valid-json');

      const service = createStorageService();
      const result = service.getDailyLog(date);

      expect(result).toBeNull();
    });
  });

  // ── StorageError em falha de escrita ───────────────────────────────────────

  describe('StorageError em falha de escrita', () => {
    it('saveDailyLog() lança StorageError com código QUOTA_EXCEEDED quando localStorage.setItem lança QuotaExceededError', () => {
      // Validates: Requirements 9.3, 9.5
      const log: DailyLog = {
        date: '2024-01-15',
        trained: true,
        followedPlan: true,
        didSomethingDifferent: false,
      };

      // Simular falha de quota no localStorage.setItem via Object.defineProperty
      // (necessário porque jsdom não permite vi.spyOn diretamente em localStorage.setItem)
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const service = createStorageService();

      try {
        expect(() => service.saveDailyLog(log)).toThrow(StorageError);
        expect(() => service.saveDailyLog(log)).toThrow(
          expect.objectContaining({ code: 'QUOTA_EXCEEDED' })
        );
      } finally {
        spy.mockRestore();
        void originalSetItem; // suppress unused variable warning
      }
    });
  });
});
