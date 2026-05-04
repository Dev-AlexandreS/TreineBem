import type {
  DailyLog,
  DayOfWeek,
  Exercise,
  ExerciseExecution,
  Goals,
  ISODateString,
  ProgressPhoto,
  StorageService,
  UserSettings,
  WeeklyPlan,
} from '@/types';
import { localStorageAdapter } from './localStorage.adapter';
import { defaultWeeklyPlan } from './defaultPlan';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  WEEKLY_PLAN: 'weekly-plan',
  DAILY_LOGS: 'daily-logs',
  EXECUTIONS: 'executions',
  GOALS: 'goals',
  USER_SETTINGS: 'user-settings',
  PROGRESS_PHOTOS: 'progress-photos',
} as const;

// ─── Implementation ───────────────────────────────────────────────────────────

export class LocalStorageStorageService implements StorageService {
  // ── Weekly Plan ─────────────────────────────────────────────────────────────

  getWeeklyPlan(): WeeklyPlan {
    const stored = localStorageAdapter.getItem<WeeklyPlan | null>(
      KEYS.WEEKLY_PLAN,
      null
    );

    if (stored === null) {
      // First run — persist and return the default plan
      this.saveWeeklyPlan(defaultWeeklyPlan);
      return defaultWeeklyPlan;
    }

    return stored;
  }

  saveWeeklyPlan(plan: WeeklyPlan): void {
    localStorageAdapter.setItem(KEYS.WEEKLY_PLAN, plan);
  }

  // ── Exercises ───────────────────────────────────────────────────────────────

  addExercise(dayOfWeek: DayOfWeek, exercise: Exercise): void {
    const plan = this.getWeeklyPlan();
    plan[dayOfWeek].exercises.push(exercise);
    this.saveWeeklyPlan(plan);
  }

  updateExercise(dayOfWeek: DayOfWeek, exercise: Exercise): void {
    const plan = this.getWeeklyPlan();
    const exercises = plan[dayOfWeek].exercises;
    const index = exercises.findIndex((e) => e.id === exercise.id);

    if (index !== -1) {
      exercises[index] = exercise;
      this.saveWeeklyPlan(plan);
    }
  }

  removeExercise(dayOfWeek: DayOfWeek, exerciseId: string): void {
    const plan = this.getWeeklyPlan();
    plan[dayOfWeek].exercises = plan[dayOfWeek].exercises.filter(
      (e) => e.id !== exerciseId
    );
    this.saveWeeklyPlan(plan);
  }

  reorderExercises(dayOfWeek: DayOfWeek, orderedIds: string[]): void {
    const plan = this.getWeeklyPlan();
    const exercises = plan[dayOfWeek].exercises;

    // Build a lookup map for O(1) access
    const exerciseMap = new Map<string, Exercise>(
      exercises.map((e) => [e.id, e])
    );

    // Reconstruct the array following orderedIds; skip unknown ids
    const reordered = orderedIds
      .map((id) => exerciseMap.get(id))
      .filter((e): e is Exercise => e !== undefined);

    plan[dayOfWeek].exercises = reordered;
    this.saveWeeklyPlan(plan);
  }

  // ── Daily Log ────────────────────────────────────────────────────────────────

  getDailyLog(date: ISODateString): DailyLog | null {
    const logs = localStorageAdapter.getItem<Record<ISODateString, DailyLog>>(
      KEYS.DAILY_LOGS,
      {}
    );
    return logs[date] ?? null;
  }

  saveDailyLog(log: DailyLog): void {
    const logs = localStorageAdapter.getItem<Record<ISODateString, DailyLog>>(
      KEYS.DAILY_LOGS,
      {}
    );
    logs[log.date] = log;
    localStorageAdapter.setItem(KEYS.DAILY_LOGS, logs);
  }

  getDailyLogs(from: ISODateString, to: ISODateString): DailyLog[] {
    const logs = localStorageAdapter.getItem<Record<ISODateString, DailyLog>>(
      KEYS.DAILY_LOGS,
      {}
    );

    return Object.values(logs).filter(
      (log) => log.date >= from && log.date <= to
    );
  }

  // ── Exercise Execution ───────────────────────────────────────────────────────

  getExerciseExecutions(date: ISODateString): ExerciseExecution[] {
    const executions = localStorageAdapter.getItem<
      Record<ISODateString, ExerciseExecution[]>
    >(KEYS.EXECUTIONS, {});
    return executions[date] ?? [];
  }

  saveExerciseExecution(execution: ExerciseExecution): void {
    const executions = localStorageAdapter.getItem<
      Record<ISODateString, ExerciseExecution[]>
    >(KEYS.EXECUTIONS, {});

    const dateExecutions = executions[execution.date] ?? [];
    const index = dateExecutions.findIndex((e) => e.id === execution.id);

    if (index !== -1) {
      // Update existing execution
      dateExecutions[index] = execution;
    } else {
      // Add new execution
      dateExecutions.push(execution);
    }

    executions[execution.date] = dateExecutions;
    localStorageAdapter.setItem(KEYS.EXECUTIONS, executions);
  }

  // ── Goals ────────────────────────────────────────────────────────────────────

  getGoals(): Goals | null {
    return localStorageAdapter.getItem<Goals | null>(KEYS.GOALS, null);
  }

  saveGoals(goals: Goals): void {
    localStorageAdapter.setItem(KEYS.GOALS, goals);
  }

  // ── User Settings ─────────────────────────────────────────────────────────────

  getUserSettings(): UserSettings | null {
    return localStorageAdapter.getItem<UserSettings | null>(KEYS.USER_SETTINGS, null);
  }

  saveUserSettings(settings: UserSettings): void {
    localStorageAdapter.setItem(KEYS.USER_SETTINGS, settings);
  }

  // ── Progress Photos ───────────────────────────────────────────────────────────

  getProgressPhotos(): ProgressPhoto[] {
    return localStorageAdapter.getItem<ProgressPhoto[]>(KEYS.PROGRESS_PHOTOS, []);
  }

  saveProgressPhoto(photo: ProgressPhoto): void {
    const photos = this.getProgressPhotos();
    const index = photos.findIndex((p) => p.id === photo.id);
    if (index !== -1) {
      photos[index] = photo;
    } else {
      photos.push(photo);
    }
    localStorageAdapter.setItem(KEYS.PROGRESS_PHOTOS, photos);
  }

  deleteProgressPhoto(id: string): void {
    const photos = this.getProgressPhotos().filter((p) => p.id !== id);
    localStorageAdapter.setItem(KEYS.PROGRESS_PHOTOS, photos);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Creates a fresh StorageService instance — useful for isolated testing. */
export function createStorageService(): StorageService {
  return new LocalStorageStorageService();
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const storageService: StorageService = new LocalStorageStorageService();
