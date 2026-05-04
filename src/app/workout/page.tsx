'use client'

import { useState } from 'react'
import { useWorkout } from '@/hooks/useWorkout'
import { useDailyLog } from '@/hooks/useDailyLog'
import DailyLogForm from '@/components/forms/DailyLogForm'
import ExerciseExecutionCard from '@/components/cards/ExerciseExecutionCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { DailyLog, Exercise, ExerciseExecution } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** Local draft state for an execution being edited before saving */
type ExecutionDraft = Partial<ExerciseExecution>

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const {
    todayPlan,
    exercises,
    executions,
    saveExecution,
    finalizeWorkout,
  } = useWorkout()

  const { saveDailyLog, dailyLog } = useDailyLog()

  // ── Local state ────────────────────────────────────────────────────────────

  /** Draft executions keyed by exerciseId — holds unsaved field changes */
  const [drafts, setDrafts] = useState<Record<string, ExecutionDraft>>({})

  /** Per-exercise validation errors keyed by exerciseId */
  const [executionErrors, setExecutionErrors] = useState<
    Record<string, Record<string, string>>
  >({})

  /** Whether the workout has been finalized */
  const [finalized, setFinalized] = useState(false)

  /** Fight day: notes and duration */
  const [fightNotes, setFightNotes] = useState('')
  const [fightDuration, setFightDuration] = useState('')

  /** Extra exercise being added */
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [extraExercise, setExtraExercise] = useState<Partial<Exercise>>({
    name: '',
    plannedSets: 3,
    plannedReps: '10',
  })

  /** Cardio registration */
  const [showCardio, setShowCardio] = useState(false)
  const [cardioDuration, setCardioDuration] = useState('')

  // ── Derived ────────────────────────────────────────────────────────────────

  /** Merge saved executions with local drafts for display */
  function getMergedExecution(exerciseId: string): ExerciseExecution | undefined {
    const saved = executions.find((e) => e.exerciseId === exerciseId)
    const draft = drafts[exerciseId]
    if (!saved && !draft) return undefined
    return { ...(saved ?? {}), ...(draft ?? {}) } as ExerciseExecution
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleExecutionChange(
    exercise: Exercise,
    partial: Partial<ExerciseExecution>
  ) {
    setDrafts((prev) => ({
      ...prev,
      [exercise.id]: { ...(prev[exercise.id] ?? {}), ...partial },
    }))
    // Clear errors for changed fields
    if (executionErrors[exercise.id]) {
      const changedFields = Object.keys(partial)
      setExecutionErrors((prev) => {
        const exerciseErrors = { ...(prev[exercise.id] ?? {}) }
        for (const field of changedFields) {
          delete exerciseErrors[field]
        }
        return { ...prev, [exercise.id]: exerciseErrors }
      })
    }
  }

  function handleSaveExecution(exercise: Exercise) {
    const draft = drafts[exercise.id] ?? {}
    const merged = getMergedExecution(exercise.id)

    const execution: Partial<ExerciseExecution> = {
      id: merged?.id ?? crypto.randomUUID(),
      date: getTodayDate(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      setsCompleted: merged?.setsCompleted ?? 0,
      repsCompleted: merged?.repsCompleted ?? 0,
      completed: merged?.completed ?? false,
      ...(merged?.weightUsed !== undefined && { weightUsed: merged.weightUsed }),
      ...(merged?.notes ? { notes: merged.notes } : {}),
      ...draft,
    }

    const success = saveExecution(execution)
    if (!success) {
      // saveExecution sets validationErrors on the hook — we surface them per-exercise
      // by re-reading from the hook's validationErrors (not directly accessible here)
      // so we rely on the card's inline display via errors prop
    }
    return success
  }

  function handleFinalizeWorkout() {
    // Save all pending drafts first
    let allValid = true
    for (const exercise of exercises) {
      const draft = drafts[exercise.id]
      if (draft && Object.keys(draft).length > 0) {
        const ok = handleSaveExecution(exercise)
        if (!ok) allValid = false
      }
    }

    if (!allValid) return

    // Save cardio as a special execution if provided
    if (showCardio && cardioDuration !== '') {
      const cardioExecution: Partial<ExerciseExecution> = {
        id: crypto.randomUUID(),
        date: getTodayDate(),
        exerciseId: 'cardio-extra',
        exerciseName: 'Cardio',
        setsCompleted: 1,
        repsCompleted: Number(cardioDuration),
        completed: true,
        notes: `Cardio: ${cardioDuration} minutos`,
      }
      saveExecution(cardioExecution)
    }

    finalizeWorkout()
    setFinalized(true)
  }

  function handleFinalizeFight() {
    // For fight days, save a single execution representing the fight session
    const fightExecution: Partial<ExerciseExecution> = {
      id: crypto.randomUUID(),
      date: getTodayDate(),
      exerciseId: 'fight-session',
      exerciseName: 'Aula de Luta',
      setsCompleted: 1,
      repsCompleted: fightDuration !== '' ? Number(fightDuration) : 0,
      completed: true,
      ...(fightNotes.trim() !== '' && { notes: fightNotes.trim() }),
    }
    saveExecution(fightExecution)
    finalizeWorkout()
    setFinalized(true)
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (todayPlan === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  const dayType = todayPlan.dayType

  // ── Rest day: show DailyLogForm for weight, water and notes ───────────────
  // Requirements: 5.10

  if (dayType === 'rest') {
    function handleSave(log: DailyLog) {
      saveDailyLog(log)
    }

    return (
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Treino do Dia</h1>

        <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
          <p className="text-gray-400 text-center py-2 mb-4">Dia de descanso 🛌</p>
          <p className="text-sm text-gray-400 mb-4">
            Hoje é dia de descanso. Registre seu peso, hidratação e observações do dia.
          </p>
          <DailyLogForm
            log={dailyLog ?? undefined}
            onSave={handleSave}
          />
        </div>
      </div>
    )
  }

  // ── Fight day — Requirement 5.9 ───────────────────────────────────────────

  if (dayType === 'fight') {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Treino do Dia</h1>

        <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥊</span>
            <p className="text-white font-semibold">Dia de Luta</p>
          </div>

          {finalized ? (
            <div className="rounded-xl bg-green-950 border border-green-700 p-4 text-center">
              <p className="text-green-400 font-semibold">Treino finalizado! 🎉</p>
              <p className="text-gray-400 text-sm mt-1">
                Seu registro foi salvo com sucesso.
              </p>
            </div>
          ) : (
            <>
              {/* Duration */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fight-duration"
                  className="text-sm font-medium text-gray-300"
                >
                  Duração da aula (minutos){' '}
                  <span className="text-gray-500 text-xs font-normal">opcional</span>
                </label>
                <input
                  id="fight-duration"
                  type="number"
                  min={0}
                  max={300}
                  value={fightDuration}
                  onChange={(e) => setFightDuration(e.target.value)}
                  placeholder="Ex: 60"
                  className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fight-notes"
                  className="text-sm font-medium text-gray-300"
                >
                  Observações{' '}
                  <span className="text-gray-500 text-xs font-normal">opcional</span>
                </label>
                <textarea
                  id="fight-notes"
                  rows={3}
                  value={fightNotes}
                  onChange={(e) => setFightNotes(e.target.value)}
                  placeholder="Como foi a aula? Técnicas trabalhadas, intensidade..."
                  className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleFinalizeFight}
                className="w-full min-h-[44px] rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
              >
                Finalizar
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Workout day — Requirements 5.1–5.8 ───────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-white">Treino do Dia</h1>

      {finalized ? (
        <div className="rounded-2xl bg-green-950 border border-green-700 p-6 text-center space-y-2">
          <p className="text-green-400 text-xl font-bold">Treino finalizado! 🎉</p>
          <p className="text-gray-400 text-sm">
            Todas as execuções foram salvas e seu registro diário foi atualizado.
          </p>
        </div>
      ) : (
        <>
          {/* Exercise list — Requirements 5.2, 5.3, 5.4 */}
          {exercises.length === 0 ? (
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 text-center">
              <p className="text-gray-400">Nenhum exercício planejado para hoje.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <ExerciseExecutionCard
                  key={exercise.id}
                  exercise={exercise}
                  execution={getMergedExecution(exercise.id)}
                  onChange={(partial) => handleExecutionChange(exercise, partial)}
                  errors={executionErrors[exercise.id]}
                />
              ))}
            </div>
          )}

          {/* Add extra exercise — Requirement 5.5 */}
          {showExtraForm ? (
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white">Exercício extra</h2>

              <div className="flex flex-col gap-1">
                <label htmlFor="extra-name" className="text-xs font-medium text-gray-400">
                  Nome do exercício
                </label>
                <input
                  id="extra-name"
                  type="text"
                  value={extraExercise.name ?? ''}
                  onChange={(e) =>
                    setExtraExercise((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Rosca direta"
                  className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="extra-sets" className="text-xs font-medium text-gray-400">
                    Séries
                  </label>
                  <input
                    id="extra-sets"
                    type="number"
                    min={1}
                    max={20}
                    value={extraExercise.plannedSets ?? ''}
                    onChange={(e) =>
                      setExtraExercise((prev) => ({
                        ...prev,
                        plannedSets: Number(e.target.value),
                      }))
                    }
                    placeholder="3"
                    className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="extra-reps" className="text-xs font-medium text-gray-400">
                    Repetições
                  </label>
                  <input
                    id="extra-reps"
                    type="text"
                    value={extraExercise.plannedReps ?? ''}
                    onChange={(e) =>
                      setExtraExercise((prev) => ({
                        ...prev,
                        plannedReps: e.target.value,
                      }))
                    }
                    placeholder="10–12"
                    className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExtraForm(false)}
                  className="flex-1 min-h-[44px] rounded-lg border border-gray-700 bg-gray-900 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!extraExercise.name?.trim()) return
                    const newExercise: Exercise = {
                      id: crypto.randomUUID(),
                      name: extraExercise.name.trim(),
                      muscleGroup: 'other',
                      plannedSets: extraExercise.plannedSets ?? 3,
                      plannedReps: extraExercise.plannedReps ?? '10',
                    }
                    // Save immediately as a completed execution
                    const execution: Partial<ExerciseExecution> = {
                      id: crypto.randomUUID(),
                      date: getTodayDate(),
                      exerciseId: newExercise.id,
                      exerciseName: newExercise.name,
                      setsCompleted: newExercise.plannedSets,
                      repsCompleted: 0,
                      completed: false,
                    }
                    saveExecution(execution)
                    setExtraExercise({ name: '', plannedSets: 3, plannedReps: '10' })
                    setShowExtraForm(false)
                  }}
                  className="flex-1 min-h-[44px] rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowExtraForm(true)}
              className="w-full min-h-[44px] rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm hover:border-gray-400 hover:text-gray-300 transition-colors"
            >
              + Adicionar exercício extra
            </button>
          )}

          {/* Cardio registration — Requirement 5.6 */}
          {showCardio ? (
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white">Registrar cardio</h2>
              <div className="flex flex-col gap-1">
                <label htmlFor="cardio-duration" className="text-xs font-medium text-gray-400">
                  Duração (minutos)
                </label>
                <input
                  id="cardio-duration"
                  type="number"
                  min={0}
                  max={300}
                  value={cardioDuration}
                  onChange={(e) => setCardioDuration(e.target.value)}
                  placeholder="Ex: 30"
                  className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCardio(false)}
                className="w-full min-h-[44px] rounded-lg border border-gray-700 bg-gray-900 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCardio(true)}
              className="w-full min-h-[44px] rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm hover:border-gray-400 hover:text-gray-300 transition-colors"
            >
              + Registrar cardio
            </button>
          )}

          {/* Finalizar Treino — Requirements 5.7, 5.8 */}
          <button
            type="button"
            onClick={handleFinalizeWorkout}
            className="w-full min-h-[44px] rounded-xl bg-green-700 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Finalizar Treino
          </button>
        </>
      )}
    </div>
  )
}
