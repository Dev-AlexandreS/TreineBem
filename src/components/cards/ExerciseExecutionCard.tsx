'use client'

import type { Exercise, ExerciseExecution } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExerciseExecutionCardProps {
  /** The planned exercise — provides reference values and identity */
  exercise: Exercise
  /** Existing execution data for pre-fill (optional) */
  execution?: ExerciseExecution
  /** Called whenever any field changes */
  onChange: (execution: Partial<ExerciseExecution>) => void
  /** Validation errors keyed by field name */
  errors?: Record<string, string>
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Card for recording the actual execution of a planned exercise.
 *
 * Displays planned values (sets, reps, weight) as read-only reference and
 * exposes editable fields for the actual execution data. When the exercise is
 * marked as completed, a green visual highlight is applied.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export default function ExerciseExecutionCard({
  exercise,
  execution,
  onChange,
  errors = {},
}: ExerciseExecutionCardProps) {
  const completed = execution?.completed ?? false

  // ── Helpers ────────────────────────────────────────────────────────────────

  function handleNumberChange(field: keyof ExerciseExecution, value: string) {
    const parsed = value === '' ? undefined : Number(value)
    onChange({ [field]: parsed })
  }

  function handleTextChange(field: keyof ExerciseExecution, value: string) {
    onChange({ [field]: value === '' ? undefined : value })
  }

  function handleCompletedToggle(value: boolean) {
    onChange({ completed: value })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      data-testid="exercise-execution-card"
      data-completed={completed}
      className={[
        'rounded-2xl border p-4 space-y-4 transition-colors',
        completed
          ? 'bg-green-950 border-green-700'
          : 'bg-gray-800 border-gray-700',
      ].join(' ')}
    >
      {/* Exercise name + completion badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white leading-tight">
          {exercise.name}
        </h3>
        {completed && (
          <span
            aria-label="Exercício concluído"
            className="shrink-0 text-xs font-medium text-green-400 bg-green-900 border border-green-700 rounded-full px-2 py-0.5"
          >
            ✓ Concluído
          </span>
        )}
      </div>

      {/* Planned reference values (read-only) — Requirement 6.1 */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span>
          Planejado:{' '}
          <span className="text-gray-300 font-medium">
            {exercise.plannedSets}×{exercise.plannedReps}
          </span>
        </span>
        {exercise.plannedWeight !== undefined && (
          <span>
            Carga:{' '}
            <span className="text-gray-300 font-medium">{exercise.plannedWeight} kg</span>
          </span>
        )}
        {exercise.restSeconds !== undefined && (
          <span>
            Descanso:{' '}
            <span className="text-gray-300 font-medium">{exercise.restSeconds}s</span>
          </span>
        )}
      </div>

      {/* Editable fields — Requirements 6.2, 6.3, 6.4, 6.5 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Séries realizadas — Requirement 6.3 */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`sets-${exercise.id}`}
            className="text-xs font-medium text-gray-400"
          >
            Séries realizadas <span className="text-red-400" aria-hidden="true">*</span>
          </label>
          <input
            id={`sets-${exercise.id}`}
            type="number"
            min={0}
            max={20}
            value={execution?.setsCompleted ?? ''}
            onChange={(e) => handleNumberChange('setsCompleted', e.target.value)}
            placeholder={String(exercise.plannedSets)}
            aria-invalid={!!errors.setsCompleted}
            aria-describedby={errors.setsCompleted ? `sets-error-${exercise.id}` : undefined}
            className={[
              'rounded-lg bg-gray-900 border px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.setsCompleted ? 'border-red-500' : 'border-gray-700',
            ].join(' ')}
          />
          {errors.setsCompleted && (
            <p
              id={`sets-error-${exercise.id}`}
              role="alert"
              className="text-xs text-red-400"
            >
              {errors.setsCompleted}
            </p>
          )}
        </div>

        {/* Repetições realizadas — Requirement 6.4 */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`reps-${exercise.id}`}
            className="text-xs font-medium text-gray-400"
          >
            Reps realizadas <span className="text-red-400" aria-hidden="true">*</span>
          </label>
          <input
            id={`reps-${exercise.id}`}
            type="number"
            min={0}
            max={100}
            value={execution?.repsCompleted ?? ''}
            onChange={(e) => handleNumberChange('repsCompleted', e.target.value)}
            placeholder={exercise.plannedReps}
            aria-invalid={!!errors.repsCompleted}
            aria-describedby={errors.repsCompleted ? `reps-error-${exercise.id}` : undefined}
            className={[
              'rounded-lg bg-gray-900 border px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.repsCompleted ? 'border-red-500' : 'border-gray-700',
            ].join(' ')}
          />
          {errors.repsCompleted && (
            <p
              id={`reps-error-${exercise.id}`}
              role="alert"
              className="text-xs text-red-400"
            >
              {errors.repsCompleted}
            </p>
          )}
        </div>
      </div>

      {/* Carga usada (opcional) — Requirement 6.5 */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`weight-${exercise.id}`}
          className="text-xs font-medium text-gray-400"
        >
          Carga usada (kg){' '}
          <span className="text-gray-600 text-xs font-normal">opcional</span>
        </label>
        <input
          id={`weight-${exercise.id}`}
          type="number"
          min={0}
          step={0.5}
          value={execution?.weightUsed ?? ''}
          onChange={(e) => handleNumberChange('weightUsed', e.target.value)}
          placeholder={
            exercise.plannedWeight !== undefined ? String(exercise.plannedWeight) : 'Ex: 60'
          }
          className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Concluiu (Sim/Não) — Requirement 6.6 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Concluiu</span>
        <div className="flex gap-3" role="group" aria-label="Concluiu este exercício">
          <button
            type="button"
            aria-pressed={completed === true}
            onClick={() => handleCompletedToggle(true)}
            className={[
              'flex-1 min-h-[44px] rounded-lg border text-sm font-medium transition-colors',
              completed === true
                ? 'bg-green-700 border-green-600 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white',
            ].join(' ')}
          >
            Sim
          </button>
          <button
            type="button"
            aria-pressed={completed === false}
            onClick={() => handleCompletedToggle(false)}
            className={[
              'flex-1 min-h-[44px] rounded-lg border text-sm font-medium transition-colors',
              completed === false && execution !== undefined
                ? 'bg-gray-600 border-gray-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white',
            ].join(' ')}
          >
            Não
          </button>
        </div>
        {errors.completed && (
          <p role="alert" className="text-xs text-red-400">
            {errors.completed}
          </p>
        )}
      </div>

      {/* Observação (opcional) — Requirement 6.7 */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`notes-${exercise.id}`}
          className="text-xs font-medium text-gray-400"
        >
          Observação{' '}
          <span className="text-gray-600 text-xs font-normal">opcional</span>
        </label>
        <textarea
          id={`notes-${exercise.id}`}
          rows={2}
          value={execution?.notes ?? ''}
          onChange={(e) => handleTextChange('notes', e.target.value)}
          placeholder="Notas sobre a execução..."
          className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  )
}
