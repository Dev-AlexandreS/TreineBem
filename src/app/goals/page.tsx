'use client'

import { useState } from 'react'
import { useGoals } from '@/hooks/useGoals'
import { useDashboard } from '@/hooks/useDashboard'
import GoalsForm from '@/components/forms/GoalsForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Goals } from '@/types'

// ─── Progress bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  /** 0–1 clamped fraction */
  value: number
  /** Colour variant */
  variant?: 'blue' | 'green' | 'yellow'
}

function ProgressBar({ value, variant = 'blue' }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value))
  const pct = Math.round(clamped * 100)

  const trackColour = 'bg-gray-700'
  const fillColour =
    variant === 'green'
      ? 'bg-green-500'
      : variant === 'yellow'
      ? 'bg-yellow-500'
      : 'bg-blue-500'

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full h-2 rounded-full overflow-hidden ${trackColour}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillColour}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Progress card ────────────────────────────────────────────────────────────

interface ProgressCardProps {
  label: string
  current: string
  goal: string
  fraction: number
  variant?: 'blue' | 'green' | 'yellow'
  note?: string
}

function ProgressCard({ label, current, goal, fraction, variant, note }: ProgressCardProps) {
  return (
    <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-xs text-gray-400 shrink-0">
          {current} / {goal}
        </span>
      </div>
      <ProgressBar value={fraction} variant={variant} />
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Goals page — displays current progress against each goal and allows the
 * user to create or update their fitness goals.
 *
 * Requirements: 8.1, 8.7, 8.8, 8.9, 8.10
 */
export default function GoalsPage() {
  const { goals, saveGoals } = useGoals()
  const { currentWeight, weeklyCompletionRate, averageWater, isLoading } = useDashboard()

  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSave(newGoals: Goals) {
    const ok = saveGoals(newGoals)
    if (ok) {
      setIsEditing(false)
      setSaved(true)
      // Hide the success banner after 3 s
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function handleCancel() {
    setIsEditing(false)
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  // ── No goals yet — show form directly ─────────────────────────────────────

  if (goals === null && !isEditing) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Metas</h1>

        <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
          <p className="text-sm text-gray-400 mb-4">
            Defina suas metas para acompanhar seu progresso.
          </p>
          <GoalsForm onSave={handleSave} />
        </div>
      </div>
    )
  }

  // ── Derived progress values ────────────────────────────────────────────────

  /**
   * Weight progress: how far the user has moved from initialWeight toward
   * targetWeight. Clamped to [0, 1].
   * Requirements: 8.9
   */
  const weightFraction: number = (() => {
    if (goals === null || currentWeight === null) return 0
    const total = goals.initialWeight - goals.targetWeight
    if (total === 0) return 1
    const done = goals.initialWeight - currentWeight
    return done / total
  })()

  /**
   * Water progress: average daily water vs goal.
   * Requirements: 8.9
   */
  const waterFraction: number =
    goals !== null && goals.dailyWaterLiters > 0
      ? averageWater / goals.dailyWaterLiters
      : 0

  /**
   * Workout frequency: weeklyCompletionRate is already a 0–1 fraction of
   * planned workout days completed this week.
   * Requirements: 8.9
   */
  const workoutFraction: number = weeklyCompletionRate

  // ── Congratulations condition ──────────────────────────────────────────────
  // Requirements: 8.10
  const showCongrats =
    goals !== null && currentWeight !== null && currentWeight <= goals.targetWeight

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white">Metas</h1>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-h-[44px] min-w-[44px] px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {/* Success banner */}
      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-green-950 border border-green-700 px-4 py-3 text-sm text-green-400 font-medium"
        >
          Metas salvas com sucesso! ✓
        </div>
      )}

      {/* Congratulations banner — Requirement 8.10 */}
      {showCongrats && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl bg-green-950 border border-green-600 p-4 text-center space-y-1"
        >
          <p className="text-2xl">🎉</p>
          <p className="text-green-400 font-bold text-base">Parabéns!</p>
          <p className="text-sm text-green-300">
            Você atingiu seu peso alvo de{' '}
            <span className="font-semibold">{goals!.targetWeight.toFixed(1)} kg</span>!
          </p>
        </div>
      )}

      {/* Progress section — Requirements 8.9 */}
      {goals !== null && !isEditing && (
        <section aria-label="Progresso atual">
          <h2 className="text-base font-semibold text-white mb-3">Progresso atual</h2>

          <div className="space-y-3">
            {/* Weight progress */}
            <ProgressCard
              label="Peso"
              current={
                currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : '—'
              }
              goal={`${goals.targetWeight.toFixed(1)} kg`}
              fraction={weightFraction}
              variant={showCongrats ? 'green' : 'blue'}
              note={
                currentWeight !== null
                  ? `Peso inicial: ${goals.initialWeight.toFixed(1)} kg`
                  : 'Nenhum peso registrado ainda'
              }
            />

            {/* Water progress */}
            <ProgressCard
              label="Água diária (média 7 dias)"
              current={`${averageWater.toFixed(1)} L`}
              goal={`${goals.dailyWaterLiters.toFixed(1)} L`}
              fraction={waterFraction}
              variant={waterFraction >= 1 ? 'green' : 'blue'}
            />

            {/* Workout frequency */}
            <ProgressCard
              label="Treinos esta semana"
              current={`${Math.round(workoutFraction * goals.weeklyWorkouts)} treinos`}
              goal={`${goals.weeklyWorkouts} treinos`}
              fraction={workoutFraction}
              variant={workoutFraction >= 1 ? 'green' : 'blue'}
            />

            {/* Cardio goal — display only, no tracking data yet */}
            <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-300">
                  Meta de cardio semanal
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {goals.weeklyCardioMinutes} min / semana
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Registre cardio durante o treino para acompanhar o progresso.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Goals summary (when not editing) */}
      {goals !== null && !isEditing && (
        <section aria-label="Metas definidas">
          <h2 className="text-base font-semibold text-white mb-3">Metas definidas</h2>

          <dl className="rounded-2xl bg-gray-800 border border-gray-700 divide-y divide-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-400">Peso inicial</dt>
              <dd className="text-sm font-medium text-white">
                {goals.initialWeight.toFixed(1)} kg
              </dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-400">Peso alvo</dt>
              <dd className="text-sm font-medium text-white">
                {goals.targetWeight.toFixed(1)} kg
              </dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-400">Água diária</dt>
              <dd className="text-sm font-medium text-white">
                {goals.dailyWaterLiters.toFixed(1)} L
              </dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-400">Treinos por semana</dt>
              <dd className="text-sm font-medium text-white">{goals.weeklyWorkouts}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-400">Cardio semanal</dt>
              <dd className="text-sm font-medium text-white">
                {goals.weeklyCardioMinutes} min
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* Edit form */}
      {isEditing && (
        <section
          aria-label="Editar metas"
          className="rounded-2xl bg-gray-800 border border-gray-700 p-4"
        >
          <h2 className="text-base font-semibold text-white mb-4">Editar metas</h2>
          <GoalsForm
            goals={goals ?? undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </section>
      )}
    </div>
  )
}
