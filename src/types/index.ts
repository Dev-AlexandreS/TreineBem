// ─── Base Types ───────────────────────────────────────────────────────────────

/** ISO 8601 date string in "YYYY-MM-DD" format */
export type ISODateString = string;

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulder'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'abs'
  | 'glutes'
  | 'cardio'
  | 'other';

export type DayType = 'workout' | 'fight' | 'rest';

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface Exercise {
  /** UUID */
  id: string;
  /** Minimum 2 characters */
  name: string;
  muscleGroup: MuscleGroup;
  /** Integer between 1 and 20 */
  plannedSets: number;
  /** "10" or "10–12" */
  plannedReps: string;
  /** kg, optional */
  plannedWeight?: number;
  /** seconds, optional */
  restSeconds?: number;
  notes?: string;
}

export interface DayPlan {
  dayType: DayType;
  exercises: Exercise[];
  /** Used for days of type "fight" */
  notes?: string;
}

export type WeeklyPlan = Record<DayOfWeek, DayPlan>;

export interface DailyLog {
  date: ISODateString;
  /** 30.0–300.0 kg, optional */
  weight?: number;
  /** 0.0–10.0 L, optional */
  waterLiters?: number;
  trained: boolean;
  followedPlan: boolean;
  didSomethingDifferent: boolean;
  differentDescription?: string;
  notes?: string;
}

export interface ExerciseExecution {
  id: string;
  date: ISODateString;
  exerciseId: string;
  /** Snapshot of the exercise name at the time of execution */
  exerciseName: string;
  /** Integer between 0 and 20 */
  setsCompleted: number;
  /** Integer between 0 and 100 */
  repsCompleted: number;
  /** kg, optional */
  weightUsed?: number;
  completed: boolean;
  notes?: string;
}

export interface Goals {
  /** 30.0–300.0 kg */
  initialWeight: number;
  /** 30.0–300.0 kg */
  targetWeight: number;
  /** 0.5–10.0 L */
  dailyWaterLiters: number;
  /** Integer between 1 and 7 */
  weeklyWorkouts: number;
  /** Integer between 0 and 600 */
  weeklyCardioMinutes: number;
}

// ─── Storage Service Interface ────────────────────────────────────────────────

/**
 * Abstracts all data read/write operations.
 * No UI component should access LocalStorage directly — use this interface instead.
 * The interface is designed to allow future replacement with a Firebase or PostgreSQL adapter.
 */
export interface StorageService {
  // Weekly Plan
  getWeeklyPlan(): WeeklyPlan;
  saveWeeklyPlan(plan: WeeklyPlan): void;

  // Exercises
  addExercise(dayOfWeek: DayOfWeek, exercise: Exercise): void;
  updateExercise(dayOfWeek: DayOfWeek, exercise: Exercise): void;
  removeExercise(dayOfWeek: DayOfWeek, exerciseId: string): void;
  reorderExercises(dayOfWeek: DayOfWeek, orderedIds: string[]): void;

  // Daily Log
  getDailyLog(date: ISODateString): DailyLog | null;
  saveDailyLog(log: DailyLog): void;
  getDailyLogs(from: ISODateString, to: ISODateString): DailyLog[];

  // Exercise Execution
  getExerciseExecutions(date: ISODateString): ExerciseExecution[];
  saveExerciseExecution(execution: ExerciseExecution): void;

  // Goals
  getGoals(): Goals | null;
  saveGoals(goals: Goals): void;
}

// ─── Validation Interfaces ────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  /** Maps field name to error message */
  errors: Record<string, string>;
}

export interface Validator {
  validateExercise(data: Partial<Exercise>): ValidationResult;
  validateDailyLog(data: Partial<DailyLog>): ValidationResult;
  validateGoals(data: Partial<Goals>): ValidationResult;
  validateExerciseExecution(data: Partial<ExerciseExecution>): ValidationResult;
}

// ─── Storage Error ────────────────────────────────────────────────────────────

export type StorageErrorCode = 'QUOTA_EXCEEDED' | 'SECURITY_ERROR' | 'UNKNOWN';

/**
 * Typed error thrown by the StorageService when a persistence operation fails.
 */
export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(message: string, code: StorageErrorCode = 'UNKNOWN') {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    // Restore prototype chain (required when extending built-in classes in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
