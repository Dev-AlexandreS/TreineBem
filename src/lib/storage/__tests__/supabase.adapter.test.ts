// Feature: supabase-vercel-migration
// Validates: Requirements 4.11, 5.4, 5.7, 5.11, 5.2, 5.3

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}));

// We need to mock @/generated/prisma for Prisma error classes
vi.mock('@/generated/prisma', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, unknown>;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = code;
    }
  }
  class PrismaClientInitializationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PrismaClientInitializationError';
    }
  }
  return {
    Prisma: {
      PrismaClientKnownRequestError,
      PrismaClientInitializationError,
    },
  };
});

// Use vi.hoisted so prismaMock is available inside the vi.mock factory
const prismaMock = vi.hoisted(() => ({
  weeklyPlan: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    findFirst: vi.fn(),
  },
  exercise: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  dailyLog: {
    findFirst: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  exerciseExecution: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  goals: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { SupabaseAdapter } from '../supabase.adapter';
import { StorageError } from '@/types';
import { defaultWeeklyPlan } from '../defaultPlan';
import type { DailyLog, ExerciseExecution, Goals } from '@/types';

// ─── Generators ───────────────────────────────────────────────────────────────

/** UUID-like string generator */
const arbUuid = fc.uuid();

/** Two distinct UUIDs */
const arbTwoDistinctUuids = fc
  .tuple(fc.uuid(), fc.uuid())
  .filter(([a, b]) => a !== b);

/** Arbitrary error types to throw */
const arbError = fc.oneof(
  fc.string({ minLength: 1 }).map((msg) => new Error(msg)),
  fc.string({ minLength: 1 }).map((msg) => new TypeError(msg)),
  fc.string({ minLength: 1 }).map((msg) => new RangeError(msg)),
  fc.constant(new Error('network timeout')),
  fc.constant('string error'),
  fc.constant(42),
  fc.constant(null),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetAllMocks() {
  vi.clearAllMocks();
  // Default: return empty arrays / null for all reads
  prismaMock.weeklyPlan.findMany.mockResolvedValue([]);
  prismaMock.weeklyPlan.upsert.mockResolvedValue({ id: 'wp-id-1' });
  prismaMock.weeklyPlan.findFirst.mockResolvedValue(null);
  prismaMock.exercise.createMany.mockResolvedValue({ count: 0 });
  prismaMock.exercise.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.exercise.create.mockResolvedValue({});
  prismaMock.exercise.update.mockResolvedValue({});
  prismaMock.exercise.delete.mockResolvedValue({});
  prismaMock.dailyLog.findFirst.mockResolvedValue(null);
  prismaMock.dailyLog.upsert.mockResolvedValue({});
  prismaMock.dailyLog.findMany.mockResolvedValue([]);
  prismaMock.dailyLog.create.mockResolvedValue({ id: 'dl-id-1' });
  prismaMock.exerciseExecution.findMany.mockResolvedValue([]);
  prismaMock.exerciseExecution.upsert.mockResolvedValue({});
  prismaMock.goals.findFirst.mockResolvedValue(null);
  prismaMock.goals.update.mockResolvedValue({});
  prismaMock.goals.create.mockResolvedValue({});
  prismaMock.$transaction.mockImplementation((ops: unknown[]) =>
    Promise.all(ops),
  );
}

// ─── Property 2: User data isolation ─────────────────────────────────────────

describe('Property 2: User data isolation', () => {
  // Feature: supabase-vercel-migration, Property 2: User data isolation
  // Validates: Requirements 4.11, 5.4

  beforeEach(resetAllMocks);

  it('getWeeklyPlan uses userA id, not userB id', async () => {
    await fc.assert(
      fc.asyncProperty(arbTwoDistinctUuids, async ([userA, userB]) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userA);
        await adapter.getWeeklyPlan();

        const calls = prismaMock.weeklyPlan.findMany.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const whereArg = calls[0][0]?.where;
        expect(whereArg?.user_id).toBe(userA);
        expect(whereArg?.user_id).not.toBe(userB);
      }),
      { numRuns: 30 },
    );
  });

  it('getDailyLog uses userA id, not userB id', async () => {
    await fc.assert(
      fc.asyncProperty(arbTwoDistinctUuids, async ([userA, userB]) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userA);
        await adapter.getDailyLog('2024-01-01');

        const calls = prismaMock.dailyLog.findFirst.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const whereArg = calls[0][0]?.where;
        expect(whereArg?.user_id).toBe(userA);
        expect(whereArg?.user_id).not.toBe(userB);
      }),
      { numRuns: 30 },
    );
  });

  it('getDailyLogs uses userA id, not userB id', async () => {
    await fc.assert(
      fc.asyncProperty(arbTwoDistinctUuids, async ([userA, userB]) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userA);
        await adapter.getDailyLogs('2024-01-01', '2024-01-31');

        const calls = prismaMock.dailyLog.findMany.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const whereArg = calls[0][0]?.where;
        expect(whereArg?.user_id).toBe(userA);
        expect(whereArg?.user_id).not.toBe(userB);
      }),
      { numRuns: 30 },
    );
  });

  it('getExerciseExecutions uses userA id, not userB id', async () => {
    await fc.assert(
      fc.asyncProperty(arbTwoDistinctUuids, async ([userA, userB]) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userA);
        await adapter.getExerciseExecutions('2024-01-01');

        const calls = prismaMock.exerciseExecution.findMany.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const whereArg = calls[0][0]?.where;
        expect(whereArg?.user_id).toBe(userA);
        expect(whereArg?.user_id).not.toBe(userB);
      }),
      { numRuns: 30 },
    );
  });

  it('getGoals uses userA id, not userB id', async () => {
    await fc.assert(
      fc.asyncProperty(arbTwoDistinctUuids, async ([userA, userB]) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userA);
        await adapter.getGoals();

        const calls = prismaMock.goals.findFirst.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const whereArg = calls[0][0]?.where;
        expect(whereArg?.user_id).toBe(userA);
        expect(whereArg?.user_id).not.toBe(userB);
      }),
      { numRuns: 30 },
    );
  });
});

// ─── Property 3: All adapter queries filter by userId ─────────────────────────

describe('Property 3: All adapter queries filter by userId', () => {
  // Feature: supabase-vercel-migration, Property 3: All adapter queries filter by userId
  // Validates: Requirements 5.4

  beforeEach(resetAllMocks);

  it('getWeeklyPlan always passes user_id in where clause', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userId);
        await adapter.getWeeklyPlan();

        const calls = prismaMock.weeklyPlan.findMany.mock.calls;
        expect(calls[0][0]?.where?.user_id).toBe(userId);
      }),
      { numRuns: 50 },
    );
  });

  it('getDailyLog always passes user_id in where clause', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userId);
        await adapter.getDailyLog('2024-06-15');

        const calls = prismaMock.dailyLog.findFirst.mock.calls;
        expect(calls[0][0]?.where?.user_id).toBe(userId);
      }),
      { numRuns: 50 },
    );
  });

  it('getDailyLogs always passes user_id in where clause', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userId);
        await adapter.getDailyLogs('2024-01-01', '2024-12-31');

        const calls = prismaMock.dailyLog.findMany.mock.calls;
        expect(calls[0][0]?.where?.user_id).toBe(userId);
      }),
      { numRuns: 50 },
    );
  });

  it('getExerciseExecutions always passes user_id in where clause', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userId);
        await adapter.getExerciseExecutions('2024-06-15');

        const calls = prismaMock.exerciseExecution.findMany.mock.calls;
        expect(calls[0][0]?.where?.user_id).toBe(userId);
      }),
      { numRuns: 50 },
    );
  });

  it('getGoals always passes user_id in where clause', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userId);
        await adapter.getGoals();

        const calls = prismaMock.goals.findFirst.mock.calls;
        expect(calls[0][0]?.where?.user_id).toBe(userId);
      }),
      { numRuns: 50 },
    );
  });

  it('saveDailyLog always passes user_id in upsert data', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        const adapter = new SupabaseAdapter(userId);
        const log: DailyLog = {
          date: '2024-06-15',
          trained: true,
          followedPlan: false,
          didSomethingDifferent: false,
        };
        await adapter.saveDailyLog(log);

        const calls = prismaMock.dailyLog.upsert.mock.calls;
        expect(calls[0][0]?.where?.user_id_date?.user_id).toBe(userId);
      }),
      { numRuns: 50 },
    );
  });

  it('saveGoals always passes user_id in create/update data', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        // No existing goals → will call create
        prismaMock.goals.findFirst.mockResolvedValue(null);
        const adapter = new SupabaseAdapter(userId);
        const goals: Goals = {
          initialWeight: 80,
          targetWeight: 75,
          dailyWaterLiters: 2.5,
          weeklyWorkouts: 4,
          weeklyCardioMinutes: 120,
        };
        await adapter.saveGoals(goals);

        const calls = prismaMock.goals.create.mock.calls;
        expect(calls[0][0]?.data?.user_id).toBe(userId);
      }),
      { numRuns: 50 },
    );
  });
});

// ─── Property 4: getWeeklyPlan seeds default plan for new users ───────────────

describe('Property 4: getWeeklyPlan seeds default plan for new users', () => {
  // Feature: supabase-vercel-migration, Property 4: getWeeklyPlan seeds default plan for new users
  // Validates: Requirements 5.7

  beforeEach(resetAllMocks);

  it('returns defaultWeeklyPlan structure when no rows exist', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        // No existing plan
        prismaMock.weeklyPlan.findMany.mockResolvedValue([]);
        // upsert returns a plan row with an id
        prismaMock.weeklyPlan.upsert.mockResolvedValue({ id: `wp-${userId}` });
        prismaMock.exercise.createMany.mockResolvedValue({ count: 0 });
        prismaMock.exercise.deleteMany.mockResolvedValue({ count: 0 });

        const adapter = new SupabaseAdapter(userId);
        const result = await adapter.getWeeklyPlan();

        // Structural equivalence: same days, same dayTypes, same exercise counts
        const days = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ] as const;
        for (const day of days) {
          expect(result[day]).toBeDefined();
          expect(result[day].dayType).toBe(defaultWeeklyPlan[day].dayType);
          expect(result[day].exercises.length).toBe(
            defaultWeeklyPlan[day].exercises.length,
          );
        }
      }),
      { numRuns: 30 },
    );
  });

  it('calls prisma.weeklyPlan.upsert to persist the default plan', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (userId) => {
        resetAllMocks();
        prismaMock.weeklyPlan.findMany.mockResolvedValue([]);
        prismaMock.weeklyPlan.upsert.mockResolvedValue({ id: `wp-${userId}` });

        const adapter = new SupabaseAdapter(userId);
        await adapter.getWeeklyPlan();

        // Should have called upsert once per day (7 days)
        expect(prismaMock.weeklyPlan.upsert).toHaveBeenCalled();
        expect(prismaMock.weeklyPlan.upsert.mock.calls.length).toBe(7);
      }),
      { numRuns: 30 },
    );
  });
});

// ─── Property 7: Adapter errors are always wrapped as StorageError ────────────

describe('Property 7: Adapter errors always wrapped as StorageError', () => {
  // Feature: supabase-vercel-migration, Property 7: Adapter errors always wrapped as StorageError
  // Validates: Requirements 5.11

  const VALID_CODES = ['QUOTA_EXCEEDED', 'SECURITY_ERROR', 'UNKNOWN'];

  beforeEach(resetAllMocks);

  async function assertWrapsAsStorageError(
    setupThrow: (err: unknown) => void,
    callAdapter: (adapter: SupabaseAdapter) => Promise<unknown>,
    userId: string,
    error: unknown,
  ) {
    resetAllMocks();
    setupThrow(error);
    const adapter = new SupabaseAdapter(userId);
    let thrown: unknown;
    try {
      await callAdapter(adapter);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(StorageError);
    const se = thrown as StorageError;
    expect(se.message.length).toBeGreaterThan(0);
    expect(VALID_CODES).toContain(se.code);
  }

  it('getWeeklyPlan wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) => prismaMock.weeklyPlan.findMany.mockRejectedValue(err),
          (adapter) => adapter.getWeeklyPlan(),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });

  it('getDailyLog wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) => prismaMock.dailyLog.findFirst.mockRejectedValue(err),
          (adapter) => adapter.getDailyLog('2024-01-01'),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });

  it('getDailyLogs wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) => prismaMock.dailyLog.findMany.mockRejectedValue(err),
          (adapter) => adapter.getDailyLogs('2024-01-01', '2024-12-31'),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });

  it('getExerciseExecutions wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) =>
            prismaMock.exerciseExecution.findMany.mockRejectedValue(err),
          (adapter) => adapter.getExerciseExecutions('2024-01-01'),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });

  it('getGoals wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) => prismaMock.goals.findFirst.mockRejectedValue(err),
          (adapter) => adapter.getGoals(),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });

  it('saveDailyLog wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) => prismaMock.dailyLog.upsert.mockRejectedValue(err),
          (adapter) =>
            adapter.saveDailyLog({
              date: '2024-01-01',
              trained: false,
              followedPlan: false,
              didSomethingDifferent: false,
            }),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });

  it('saveGoals wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) => prismaMock.goals.findFirst.mockRejectedValue(err),
          (adapter) =>
            adapter.saveGoals({
              initialWeight: 80,
              targetWeight: 75,
              dailyWaterLiters: 2,
              weeklyWorkouts: 3,
              weeklyCardioMinutes: 60,
            }),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });

  it('saveExerciseExecution wraps Prisma errors as StorageError', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbError, async (userId, error) => {
        await assertWrapsAsStorageError(
          (err) => prismaMock.dailyLog.findFirst.mockRejectedValue(err),
          (adapter) =>
            adapter.saveExerciseExecution({
              id: 'exec-1',
              date: '2024-01-01',
              exerciseId: 'ex-1',
              exerciseName: 'Supino',
              setsCompleted: 3,
              repsCompleted: 10,
              completed: true,
            }),
          userId,
          error,
        );
      }),
      { numRuns: 30 },
    );
  });
});

// ─── Task 12.1: Unit tests for SupabaseAdapter method behaviour ───────────────

describe('SupabaseAdapter – Unit Tests (Task 12.1)', () => {
  // Validates: Requirements 5.2, 5.3

  beforeEach(resetAllMocks);

  // ── getWeeklyPlan returns mapped data when rows exist ──────────────────────

  it('getWeeklyPlan returns mapped plan when rows exist', async () => {
    const userId = 'user-abc';
    prismaMock.weeklyPlan.findMany.mockResolvedValue([
      {
        id: 'wp-1',
        user_id: userId,
        day_of_week: 'monday',
        day_type: 'workout',
        title: null,
        exercises: [
          {
            id: 'ex-1',
            name: 'Supino reto',
            muscle_group: 'chest',
            planned_sets: 3,
            planned_reps: '10–12',
            planned_weight: null,
            rest_seconds: null,
            notes: null,
            order_index: 0,
          },
        ],
      },
      {
        id: 'wp-2',
        user_id: userId,
        day_of_week: 'tuesday',
        day_type: 'rest',
        title: null,
        exercises: [],
      },
    ]);

    const adapter = new SupabaseAdapter(userId);
    const plan = await adapter.getWeeklyPlan();

    expect(plan.monday).toBeDefined();
    expect(plan.monday.dayType).toBe('workout');
    expect(plan.monday.exercises).toHaveLength(1);
    expect(plan.monday.exercises[0].name).toBe('Supino reto');
    expect(plan.monday.exercises[0].muscleGroup).toBe('chest');
    expect(plan.tuesday.dayType).toBe('rest');
    expect(plan.tuesday.exercises).toHaveLength(0);
  });

  // ── saveDailyLog calls upsert with correct mapped fields ──────────────────

  it('saveDailyLog calls upsert with correct mapped fields', async () => {
    const userId = 'user-abc';
    const log: DailyLog = {
      date: '2024-06-15',
      weight: 82.5,
      waterLiters: 2.5,
      trained: true,
      followedPlan: true,
      didSomethingDifferent: false,
      notes: 'Good session',
    };

    const adapter = new SupabaseAdapter(userId);
    await adapter.saveDailyLog(log);

    expect(prismaMock.dailyLog.upsert).toHaveBeenCalledOnce();
    const call = prismaMock.dailyLog.upsert.mock.calls[0][0];

    // Check where clause
    expect(call.where.user_id_date.user_id).toBe(userId);
    expect(call.where.user_id_date.date).toEqual(new Date('2024-06-15'));

    // Check data mapping (camelCase → snake_case)
    expect(call.create.user_id).toBe(userId);
    expect(call.create.weight).toBe(82.5);
    expect(call.create.water_liters).toBe(2.5);
    expect(call.create.trained).toBe(true);
    expect(call.create.followed_plan).toBe(true);
    expect(call.create.did_something_different).toBe(false);
    expect(call.create.notes).toBe('Good session');
  });

  // ── saveExerciseExecution calls upsert on id ──────────────────────────────

  it('saveExerciseExecution calls upsert on id field', async () => {
    const userId = 'user-abc';
    const execution: ExerciseExecution = {
      id: 'exec-uuid-123',
      date: '2024-06-15',
      exerciseId: 'ex-uuid-456',
      exerciseName: 'Agachamento',
      setsCompleted: 4,
      repsCompleted: 12,
      weightUsed: 60,
      completed: true,
      notes: 'Felt strong',
    };

    // Simulate existing daily log
    prismaMock.dailyLog.findFirst.mockResolvedValue({
      id: 'dl-id-1',
      user_id: userId,
      date: new Date('2024-06-15'),
    });

    const adapter = new SupabaseAdapter(userId);
    await adapter.saveExerciseExecution(execution);

    expect(prismaMock.exerciseExecution.upsert).toHaveBeenCalledOnce();
    const call = prismaMock.exerciseExecution.upsert.mock.calls[0][0];

    // Upsert is on the id field
    expect(call.where.id).toBe('exec-uuid-123');
    expect(call.create.exercise_name).toBe('Agachamento');
    expect(call.create.sets_completed).toBe(4);
    expect(call.create.reps_completed).toBe(12);
    expect(call.create.weight_used).toBe(60);
    expect(call.create.completed).toBe(true);
    expect(call.create.user_id).toBe(userId);
  });

  // ── getGoals returns null when no row exists ──────────────────────────────

  it('getGoals returns null when no row exists', async () => {
    prismaMock.goals.findFirst.mockResolvedValue(null);

    const adapter = new SupabaseAdapter('user-abc');
    const result = await adapter.getGoals();

    expect(result).toBeNull();
  });

  // ── getGoals returns mapped Goals when row exists ─────────────────────────

  it('getGoals returns mapped Goals when row exists', async () => {
    prismaMock.goals.findFirst.mockResolvedValue({
      id: 'goals-1',
      user_id: 'user-abc',
      initial_weight: '80.0',
      current_weight: '78.5',
      target_weight: '75.0',
      daily_water_liters: '2.5',
      weekly_workouts: 4,
      weekly_cardio_minutes: 120,
    });

    const adapter = new SupabaseAdapter('user-abc');
    const result = await adapter.getGoals();

    expect(result).not.toBeNull();
    expect(result!.initialWeight).toBe(80);
    expect(result!.targetWeight).toBe(75);
    expect(result!.dailyWaterLiters).toBe(2.5);
    expect(result!.weeklyWorkouts).toBe(4);
    expect(result!.weeklyCardioMinutes).toBe(120);
  });
});
