import 'server-only';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { defaultWeeklyPlan } from './defaultPlan';
import {
  StorageError,
  type DailyLog,
  type DayOfWeek,
  type DayPlan,
  type DayType,
  type Exercise,
  type ExerciseExecution,
  type Goals,
  type ISODateString,
  type WeeklyPlan,
} from '@/types';

// ─── Mapping Helpers ──────────────────────────────────────────────────────────

function toDbExercise(
  exercise: Exercise,
  userId: string,
  weeklyPlanId: string,
  orderIndex: number,
) {
  return {
    id: exercise.id,
    user_id: userId,
    weekly_plan_id: weeklyPlanId,
    name: exercise.name,
    muscle_group: exercise.muscleGroup,
    planned_sets: exercise.plannedSets,
    planned_reps: exercise.plannedReps,
    planned_weight: exercise.plannedWeight ?? null,
    rest_seconds: exercise.restSeconds ?? null,
    notes: exercise.notes ?? null,
    order_index: orderIndex,
  };
}

function fromDbExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    plannedSets: row.planned_sets,
    plannedReps: row.planned_reps,
    plannedWeight: row.planned_weight ? Number(row.planned_weight) : undefined,
    restSeconds: row.rest_seconds ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toDbDailyLog(log: DailyLog, userId: string) {
  return {
    user_id: userId,
    date: new Date(log.date),
    weight: log.weight ?? null,
    water_liters: log.waterLiters ?? null,
    trained: log.trained,
    followed_plan: log.followedPlan,
    did_something_different: log.didSomethingDifferent,
    different_description: log.differentDescription ?? null,
    notes: log.notes ?? null,
  };
}

function fromDbDailyLog(row: any): DailyLog {
  return {
    date:
      row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : String(row.date),
    weight: row.weight ? Number(row.weight) : undefined,
    waterLiters: row.water_liters ? Number(row.water_liters) : undefined,
    trained: row.trained,
    followedPlan: row.followed_plan,
    didSomethingDifferent: row.did_something_different,
    differentDescription: row.different_description ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toDbGoals(goals: Goals, userId: string) {
  return {
    user_id: userId,
    initial_weight: goals.initialWeight,
    current_weight: goals.initialWeight, // use initialWeight as current on first save
    target_weight: goals.targetWeight,
    daily_water_liters: goals.dailyWaterLiters,
    weekly_workouts: goals.weeklyWorkouts,
    weekly_cardio_minutes: goals.weeklyCardioMinutes,
  };
}

function fromDbGoals(row: any): Goals {
  return {
    initialWeight: Number(row.initial_weight),
    targetWeight: Number(row.target_weight),
    dailyWaterLiters: Number(row.daily_water_liters),
    weeklyWorkouts: row.weekly_workouts,
    weeklyCardioMinutes: row.weekly_cardio_minutes,
  };
}

function toDbExecution(
  execution: ExerciseExecution,
  userId: string,
  dailyLogId: string,
) {
  return {
    id: execution.id,
    user_id: userId,
    daily_log_id: dailyLogId,
    exercise_id: execution.exerciseId ?? null,
    exercise_name: execution.exerciseName,
    sets_completed: execution.setsCompleted,
    reps_completed: execution.repsCompleted,
    weight_used: execution.weightUsed ?? null,
    completed: execution.completed,
    notes: execution.notes ?? null,
  };
}

function fromDbExecution(row: any): ExerciseExecution {
  return {
    id: row.id,
    date:
      row.daily_log?.date instanceof Date
        ? row.daily_log.date.toISOString().split('T')[0]
        : String(row.daily_log?.date ?? ''),
    exerciseId: row.exercise_id ?? '',
    exerciseName: row.exercise_name,
    setsCompleted: row.sets_completed ?? 0,
    repsCompleted: row.reps_completed ?? 0,
    weightUsed: row.weight_used ? Number(row.weight_used) : undefined,
    completed: row.completed,
    notes: row.notes ?? undefined,
  };
}

// ─── Error Helper ─────────────────────────────────────────────────────────────

function toPrismaStorageError(error: unknown, operation: string): StorageError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new StorageError(
        `Duplicate record in ${operation}: ${error.message}`,
        'UNKNOWN',
      );
    }
    if (error.code === 'P2025') {
      return new StorageError(
        `Record not found in ${operation}: ${error.message}`,
        'UNKNOWN',
      );
    }
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new StorageError(
      `Database connection failed in ${operation}: ${error.message}`,
      'UNKNOWN',
    );
  }
  if (error instanceof Error) {
    return new StorageError(`${operation} failed: ${error.message}`, 'UNKNOWN');
  }
  return new StorageError(`${operation} failed: Unknown error`, 'UNKNOWN');
}

// ─── SupabaseAdapter ──────────────────────────────────────────────────────────

export class SupabaseAdapter {
  constructor(private readonly userId: string) {}

  // ── Weekly Plan ─────────────────────────────────────────────────────────────

  async getWeeklyPlan(): Promise<WeeklyPlan> {
    try {
      const rows = await prisma.weeklyPlan.findMany({
        where: { user_id: this.userId },
        include: {
          exercises: { orderBy: { order_index: 'asc' } },
        },
      });

      if (rows.length === 0) {
        await this.saveWeeklyPlan(defaultWeeklyPlan);
        return defaultWeeklyPlan;
      }

      const plan: Partial<WeeklyPlan> = {};
      for (const row of rows) {
        plan[row.day_of_week as DayOfWeek] = {
          dayType: row.day_type as DayType,
          exercises: row.exercises.map(fromDbExercise),
          notes: row.title ?? undefined,
        };
      }
      return plan as WeeklyPlan;
    } catch (error) {
      throw toPrismaStorageError(error, 'getWeeklyPlan');
    }
  }

  async saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    try {
      for (const [day, dayPlan] of Object.entries(plan) as [
        DayOfWeek,
        DayPlan,
      ][]) {
        const weeklyPlanRow = await prisma.weeklyPlan.upsert({
          where: {
            user_id_day_of_week: {
              user_id: this.userId,
              day_of_week: day,
            },
          },
          update: {
            day_type: dayPlan.dayType,
            title: dayPlan.notes ?? null,
          },
          create: {
            user_id: this.userId,
            day_of_week: day,
            day_type: dayPlan.dayType,
            title: dayPlan.notes ?? null,
          },
        });

        // Delete existing exercises and recreate
        await prisma.exercise.deleteMany({
          where: { weekly_plan_id: weeklyPlanRow.id },
        });

        if (dayPlan.exercises.length > 0) {
          await prisma.exercise.createMany({
            data: dayPlan.exercises.map((exercise, index) =>
              toDbExercise(exercise, this.userId, weeklyPlanRow.id, index),
            ),
          });
        }
      }
    } catch (error) {
      throw toPrismaStorageError(error, 'saveWeeklyPlan');
    }
  }

  // ── Exercises ───────────────────────────────────────────────────────────────

  async addExercise(dayOfWeek: DayOfWeek, exercise: Exercise): Promise<void> {
    try {
      const weeklyPlanRow = await prisma.weeklyPlan.findFirst({
        where: { user_id: this.userId, day_of_week: dayOfWeek },
        include: { exercises: true },
      });

      if (!weeklyPlanRow) {
        throw new StorageError(
          `Weekly plan not found for day: ${dayOfWeek}`,
          'UNKNOWN',
        );
      }

      await prisma.exercise.create({
        data: toDbExercise(
          exercise,
          this.userId,
          weeklyPlanRow.id,
          weeklyPlanRow.exercises.length,
        ),
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw toPrismaStorageError(error, 'addExercise');
    }
  }

  async updateExercise(
    _dayOfWeek: DayOfWeek,
    exercise: Exercise,
  ): Promise<void> {
    try {
      await prisma.exercise.update({
        where: { id: exercise.id, user_id: this.userId },
        data: {
          name: exercise.name,
          muscle_group: exercise.muscleGroup,
          planned_sets: exercise.plannedSets,
          planned_reps: exercise.plannedReps,
          planned_weight: exercise.plannedWeight ?? null,
          rest_seconds: exercise.restSeconds ?? null,
          notes: exercise.notes ?? null,
        },
      });
    } catch (error) {
      throw toPrismaStorageError(error, 'updateExercise');
    }
  }

  async removeExercise(
    _dayOfWeek: DayOfWeek,
    exerciseId: string,
  ): Promise<void> {
    try {
      await prisma.exercise.delete({
        where: { id: exerciseId, user_id: this.userId },
      });
    } catch (error) {
      throw toPrismaStorageError(error, 'removeExercise');
    }
  }

  async reorderExercises(
    _dayOfWeek: DayOfWeek,
    orderedIds: string[],
  ): Promise<void> {
    try {
      await prisma.$transaction(
        orderedIds.map((id, index) =>
          prisma.exercise.update({
            where: { id, user_id: this.userId },
            data: { order_index: index },
          }),
        ),
      );
    } catch (error) {
      throw toPrismaStorageError(error, 'reorderExercises');
    }
  }

  // ── Daily Log ───────────────────────────────────────────────────────────────

  async getDailyLog(date: ISODateString): Promise<DailyLog | null> {
    try {
      const row = await prisma.dailyLog.findFirst({
        where: { user_id: this.userId, date: new Date(date) },
      });
      return row ? fromDbDailyLog(row) : null;
    } catch (error) {
      throw toPrismaStorageError(error, 'getDailyLog');
    }
  }

  async saveDailyLog(log: DailyLog): Promise<void> {
    try {
      const data = toDbDailyLog(log, this.userId);
      await prisma.dailyLog.upsert({
        where: {
          user_id_date: {
            user_id: this.userId,
            date: new Date(log.date),
          },
        },
        update: data,
        create: data,
      });
    } catch (error) {
      throw toPrismaStorageError(error, 'saveDailyLog');
    }
  }

  async getDailyLogs(
    from: ISODateString,
    to: ISODateString,
  ): Promise<DailyLog[]> {
    try {
      const rows = await prisma.dailyLog.findMany({
        where: {
          user_id: this.userId,
          date: { gte: new Date(from), lte: new Date(to) },
        },
      });
      return rows.map(fromDbDailyLog);
    } catch (error) {
      throw toPrismaStorageError(error, 'getDailyLogs');
    }
  }

  // ── Exercise Executions ─────────────────────────────────────────────────────

  async getExerciseExecutions(
    date: ISODateString,
  ): Promise<ExerciseExecution[]> {
    try {
      const rows = await prisma.exerciseExecution.findMany({
        where: {
          user_id: this.userId,
          daily_log: { date: new Date(date) },
        },
        include: { daily_log: true },
      });
      return rows.map(fromDbExecution);
    } catch (error) {
      throw toPrismaStorageError(error, 'getExerciseExecutions');
    }
  }

  async saveExerciseExecution(execution: ExerciseExecution): Promise<void> {
    try {
      // Find or create the daily log for this date
      const dateObj = new Date(execution.date);
      let dailyLog = await prisma.dailyLog.findFirst({
        where: { user_id: this.userId, date: dateObj },
      });

      if (!dailyLog) {
        dailyLog = await prisma.dailyLog.create({
          data: {
            user_id: this.userId,
            date: dateObj,
            trained: true,
            followed_plan: false,
            did_something_different: false,
          },
        });
      }

      const data = toDbExecution(execution, this.userId, dailyLog.id);
      await prisma.exerciseExecution.upsert({
        where: { id: execution.id },
        update: data,
        create: data,
      });
    } catch (error) {
      throw toPrismaStorageError(error, 'saveExerciseExecution');
    }
  }

  // ── Goals ───────────────────────────────────────────────────────────────────

  async getGoals(): Promise<Goals | null> {
    try {
      const row = await prisma.goals.findFirst({
        where: { user_id: this.userId },
      });
      return row ? fromDbGoals(row) : null;
    } catch (error) {
      throw toPrismaStorageError(error, 'getGoals');
    }
  }

  async saveGoals(goals: Goals): Promise<void> {
    try {
      const data = toDbGoals(goals, this.userId);
      const existing = await prisma.goals.findFirst({
        where: { user_id: this.userId },
      });

      if (existing) {
        await prisma.goals.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.goals.create({ data });
      }
    } catch (error) {
      throw toPrismaStorageError(error, 'saveGoals');
    }
  }
}
