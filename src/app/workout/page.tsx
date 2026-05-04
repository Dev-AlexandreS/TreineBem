'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkout } from '@/hooks/useWorkout'
import { useDailyLog } from '@/hooks/useDailyLog'
import { useToast } from '@/hooks/useToast'
import DailyLogForm from '@/components/forms/DailyLogForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ToastStack } from '@/components/ui/Toast'
import WorkoutSummaryModal from '@/components/goals/WorkoutSummaryModal'
import type { WorkoutSummary } from '@/components/goals/WorkoutSummaryModal'
import type { DailyLog, Exercise, ExerciseExecution } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ExecutionDraft = Partial<ExerciseExecution>

type CardioType = 'corrida' | 'bicicleta' | 'eliptico' | 'outro'

// ─── Exercise Card ────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise
  execution: ExerciseExecution | undefined
  onComplete: (sets: number, reps: number, weight?: number) => void
  onUncomplete: () => void
}

function ExerciseCard({ exercise, execution, onComplete, onUncomplete }: ExerciseCardProps) {
  const completed = execution?.completed ?? false
  const [sets, setSets] = useState(String(execution?.setsCompleted ?? exercise.plannedSets))
  const [reps, setReps] = useState(String(execution?.repsCompleted ?? ''))
  const [weight, setWeight] = useState(String(execution?.weightUsed ?? exercise.plannedWeight ?? ''))

  return (
    <div
      className={[
        'rounded-2xl border p-5 space-y-4 transition-all',
        completed
          ? 'bg-green-950 border-green-600'
          : 'bg-gray-800 border-gray-700',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">{exercise.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Planejado:{' '}
            <span className="text-gray-300 font-medium">
              {exercise.plannedSets}×{exercise.plannedReps}
            </span>
            {exercise.plannedWeight !== undefined && (
              <span className="ml-2 text-gray-300 font-medium">
                {exercise.plannedWeight} kg
              </span>
            )}
          </p>
        </div>
        {completed && (
          <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-900/60 border border-green-700 rounded-full px-2.5 py-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Concluído
          </span>
        )}
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`sets-${exercise.id}`} className="text-xs font-medium text-gray-400">
            Séries
          </label>
          <input
            id={`sets-${exercise.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[48px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`reps-${exercise.id}`} className="text-xs font-medium text-gray-400">
            Reps
          </label>
          <input
            id={`reps-${exercise.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder={exercise.plannedReps}
            className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[48px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`weight-${exercise.id}`} className="text-xs font-medium text-gray-400">
            Carga (kg)
          </label>
          <input
            id={`weight-${exercise.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
            className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[48px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Realizado vs planejado */}
      {execution && (
        <p className="text-xs text-gray-500">
          Realizado:{' '}
          <span className="text-gray-300">
            {execution.setsCompleted}×{execution.repsCompleted}
            {execution.weightUsed !== undefined && ` · ${execution.weightUsed} kg`}
          </span>
        </p>
      )}

      {/* Concluído button */}
      {completed ? (
        <button
          type="button"
          onClick={onUncomplete}
          className="w-full min-h-[48px] rounded-xl border border-green-600 text-green-400 text-sm font-semibold hover:bg-green-900/40 transition-colors"
        >
          Desfazer conclusão
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            const s = parseInt(sets) || exercise.plannedSets
            const r = parseInt(reps) || 0
            const w = weight !== '' ? parseFloat(weight) : undefined
            onComplete(s, r, w)
          }}
          className="w-full min-h-[48px] rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 transition-colors"
        >
          ✓ Concluído
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const router = useRouter()
  const { todayPlan, exercises, executions, saveExecution, finalizeWorkout } = useWorkout()
  const { saveDailyLog, dailyLog } = useDailyLog()
  const { toasts, showSuccess, showError, dismiss } = useToast()

  // ── State ──────────────────────────────────────────────────────────────────

  const [finalized, setFinalized] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [pendingSummary, setPendingSummary] = useState<WorkoutSummary | null>(null)

  // Fight day
  const [fightNotes, setFightNotes] = useState('')
  const [fightDuration, setFightDuration] = useState('')

  // Extra exercise
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [extraName, setExtraName] = useState('')
  const [extraSets, setExtraSets] = useState('3')
  const [extraReps, setExtraReps] = useState('10')

  // Cardio
  const [showCardio, setShowCardio] = useState(false)
  const [cardioDuration, setCardioDuration] = useState('')
  const [cardioType, setCardioType] = useState<CardioType>('corrida')

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getExecution(exerciseId: string): ExerciseExecution | undefined {
    return executions.find((e) => e.exerciseId === exerciseId)
  }

  function buildSummary(): WorkoutSummary {
    const completed = executions.filter((e) => e.completed)
    const totalSets = executions.reduce((sum, e) => sum + (e.setsCompleted ?? 0), 0)
    const totalWeight = executions.reduce((sum, e) => {
      if (e.weightUsed && e.setsCompleted) return sum + e.weightUsed * e.setsCompleted
      return sum
    }, 0)
    return {
      totalExercises: exercises.length,
      completedExercises: completed.length,
      totalSets,
      totalWeightKg: totalWeight,
      estimatedDurationMin: Math.round(totalSets * 3),
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleComplete(exercise: Exercise, sets: number, reps: number, weight?: number) {
    const existing = getExecution(exercise.id)
    const execution: Partial<ExerciseExecution> = {
      id: existing?.id ?? crypto.randomUUID(),
      date: getTodayDate(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      setsCompleted: sets,
      repsCompleted: reps,
      completed: true,
      ...(weight !== undefined && { weightUsed: weight }),
    }
    saveExecution(execution)
  }

  function handleUncomplete(exercise: Exercise) {
    const existing = getExecution(exercise.id)
    if (!existing) return
    saveExecution({ ...existing, completed: false })
  }

  function handleOpenSummary() {
    // Save cardio if filled
    if (showCardio && cardioDuration !== '') {
      const cardioExecution: Partial<ExerciseExecution> = {
        id: crypto.randomUUID(),
        date: getTodayDate(),
        exerciseId: 'cardio-extra',
        exerciseName: `Cardio (${cardioType})`,
        setsCompleted: 1,
        repsCompleted: Number(cardioDuration),
        completed: true,
        notes: `${cardioType}: ${cardioDuration} min`,
      }
      saveExecution(cardioExecution)
    }
    setPendingSummary(buildSummary())
    setShowSummaryModal(true)
  }

  function handleConfirmWorkout() {
    finalizeWorkout()
    setShowSummaryModal(false)
    setFinalized(true)
    showSuccess('Treino salvo com sucesso! 💪')
    setTimeout(() => router.push('/'), 1500)
  }

  function handleFinalizeFight() {
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
    showSuccess('Aula registrada com sucesso! 🥊')
  }

  function handleAddExtra() {
    if (!extraName.trim()) return
    const execution: Partial<ExerciseExecution> = {
      id: crypto.randomUUID(),
      date: getTodayDate(),
      exerciseId: crypto.randomUUID(),
      exerciseName: extraName.trim(),
      setsCompleted: parseInt(extraSets) || 3,
      repsCompleted: parseInt(extraReps) || 0,
      completed: false,
    }
    saveExecution(execution)
    setExtraName('')
    setExtraSets('3')
    setExtraReps('10')
    setShowExtraForm(false)
    showSuccess(`${extraName.trim()} adicionado!`)
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

  // ── Rest day (Req 6.10) ────────────────────────────────────────────────────

  if (dayType === 'rest') {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Treino do Dia</h1>
        <div className="rounded-2xl bg-gray-800 border border-gray-700 p-5 space-y-4">
          <div className="text-center">
            <p className="text-3xl mb-1">🛌</p>
            <p className="text-white font-semibold">Dia de descanso</p>
            <p className="text-sm text-gray-400 mt-1">
              Registre seu peso, hidratação e observações do dia.
            </p>
          </div>
          <DailyLogForm log={dailyLog ?? undefined} onSave={(log: DailyLog) => saveDailyLog(log)} />
        </div>
      </div>
    )
  }

  // ── Fight day (Req 6.11) ───────────────────────────────────────────────────

  if (dayType === 'fight') {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <ToastStack toasts={toasts} onDismiss={dismiss} />
        <h1 className="text-2xl font-bold text-white">Treino do Dia</h1>
        <div className="rounded-2xl bg-gray-800 border border-gray-700 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥊</span>
            <div>
              <p className="text-white font-bold text-lg">Dia de Luta</p>
              {todayPlan.notes && (
                <p className="text-sm text-gray-400">{todayPlan.notes}</p>
              )}
            </div>
          </div>

          {finalized ? (
            <div className="rounded-xl bg-green-950 border border-green-700 p-4 text-center">
              <p className="text-green-400 font-semibold">Aula registrada! 🎉</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="fight-duration" className="text-sm font-medium text-gray-300">
                  Duração da aula (min){' '}
                  <span className="text-gray-500 text-xs">opcional</span>
                </label>
                <input
                  id="fight-duration"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={300}
                  value={fightDuration}
                  onChange={(e) => setFightDuration(e.target.value)}
                  placeholder="Ex: 60"
                  className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="fight-notes" className="text-sm font-medium text-gray-300">
                  Observações{' '}
                  <span className="text-gray-500 text-xs">opcional</span>
                </label>
                <textarea
                  id="fight-notes"
                  rows={3}
                  value={fightNotes}
                  onChange={(e) => setFightNotes(e.target.value)}
                  placeholder="Como foi a aula? Técnicas, intensidade..."
                  className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                type="button"
                onClick={handleFinalizeFight}
                className="w-full min-h-[48px] rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors"
              >
                Finalizar Aula
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Workout day (Req 6.1–6.9) ─────────────────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-32">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Summary modal */}
      {pendingSummary && (
        <WorkoutSummaryModal
          isOpen={showSummaryModal}
          summary={pendingSummary}
          onConfirm={handleConfirmWorkout}
          onClose={() => setShowSummaryModal(false)}
        />
      )}

      <h1 className="text-2xl font-bold text-white">Treino do Dia</h1>

      {finalized ? (
        <div className="rounded-2xl bg-green-950 border border-green-700 p-6 text-center space-y-2">
          <p className="text-3xl">🎉</p>
          <p className="text-green-400 text-xl font-bold">Treino finalizado!</p>
          <p className="text-gray-400 text-sm">Redirecionando para o Dashboard...</p>
        </div>
      ) : (
        <>
          {/* Exercise cards (Req 6.1–6.4) */}
          {exercises.length === 0 ? (
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-6 text-center">
              <p className="text-gray-400">Nenhum exercício planejado para hoje.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  execution={getExecution(exercise.id)}
                  onComplete={(s, r, w) => handleComplete(exercise, s, r, w)}
                  onUncomplete={() => handleUncomplete(exercise)}
                />
              ))}
            </div>
          )}

          {/* Extra exercise (Req 6.5) */}
          {showExtraForm ? (
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white">Exercício extra</h2>
              <div className="flex flex-col gap-1">
                <label htmlFor="extra-name" className="text-xs font-medium text-gray-400">
                  Nome
                </label>
                <input
                  id="extra-name"
                  type="text"
                  value={extraName}
                  onChange={(e) => setExtraName(e.target.value)}
                  placeholder="Ex: Rosca direta"
                  className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    inputMode="numeric"
                    value={extraSets}
                    onChange={(e) => setExtraSets(e.target.value)}
                    className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[44px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="extra-reps" className="text-xs font-medium text-gray-400">
                    Reps
                  </label>
                  <input
                    id="extra-reps"
                    type="text"
                    value={extraReps}
                    onChange={(e) => setExtraReps(e.target.value)}
                    className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[44px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExtraForm(false)}
                  className="flex-1 min-h-[44px] rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddExtra}
                  disabled={!extraName.trim()}
                  className="flex-1 min-h-[44px] rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
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

          {/* Cardio (Req 6.6) */}
          {showCardio ? (
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white">Registrar cardio</h2>
              <div className="flex flex-col gap-1">
                <label htmlFor="cardio-type" className="text-xs font-medium text-gray-400">
                  Tipo
                </label>
                <select
                  id="cardio-type"
                  value={cardioType}
                  onChange={(e) => setCardioType(e.target.value as CardioType)}
                  className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="corrida">Corrida</option>
                  <option value="bicicleta">Bicicleta</option>
                  <option value="eliptico">Elíptico</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="cardio-duration" className="text-xs font-medium text-gray-400">
                  Duração (min)
                </label>
                <input
                  id="cardio-duration"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={300}
                  value={cardioDuration}
                  onChange={(e) => setCardioDuration(e.target.value)}
                  placeholder="Ex: 30"
                  className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCardio(false)}
                className="w-full min-h-[44px] rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
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
        </>
      )}

      {/* Fixed "Finalizar Treino" button (Req 6.7) — above BottomNav (h-16) */}
      {!finalized && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent pt-4">
          <button
            type="button"
            onClick={handleOpenSummary}
            className="w-full max-w-2xl mx-auto block min-h-[56px] rounded-xl bg-green-600 text-white text-base font-bold hover:bg-green-500 active:bg-green-700 transition-colors shadow-lg"
          >
            Finalizar Treino
          </button>
        </div>
      )}
    </div>
  )
}
