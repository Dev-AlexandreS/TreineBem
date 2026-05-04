'use client'

import { useState } from 'react'
import { useGoals } from '@/hooks/useGoals'
import { useDashboard } from '@/hooks/useDashboard'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/useToast'
import GoalsForm from '@/components/forms/GoalsForm'
import ProgressBar from '@/components/ui/ProgressBar'
import SkeletonCard from '@/components/ui/SkeletonCard'
import BMICard from '@/components/goals/BMICard'
import { ToastStack } from '@/components/ui/Toast'
import { calculateBMI } from '@/lib/calculators/bmi.calculator'
import type { Goals } from '@/types'

// ─── Progress card ────────────────────────────────────────────────────────────

interface ProgressCardProps {
  label: string
  current: string
  goal: string
  fraction: number
  variant?: 'blue' | 'green' | 'yellow' | 'red'
  note?: string
}

function ProgressCard({ label, current, goal, fraction, variant = 'blue', note }: ProgressCardProps) {
  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-xs text-gray-400 shrink-0">
          {current} / {goal}
        </span>
      </div>
      <ProgressBar value={fraction} variant={variant} label={label} />
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Página de Metas com barras de progresso, IMC e formulário de edição.
 *
 * Requirements: 9.1–9.8, 13.3, 13.4
 */
export default function GoalsPage() {
  const { goals, saveGoals } = useGoals()
  const { currentWeight, weeklyCompletionRate, averageWater, isLoading } = useDashboard()
  const { settings } = useSettings()
  const { toasts, showSuccess, showError, dismiss } = useToast()

  const [isEditing, setIsEditing] = useState(false)

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSave(newGoals: Goals) {
    const ok = saveGoals(newGoals)
    if (ok) {
      setIsEditing(false)
      showSuccess('Metas salvas com sucesso!')
    } else {
      showError('Erro ao salvar metas. Verifique os campos.')
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-700 rounded-full w-1/4 animate-pulse" />
        <SkeletonCard lines={3} height={100} />
        <SkeletonCard lines={3} height={100} />
      </div>
    )
  }

  // ── No goals yet ───────────────────────────────────────────────────────────

  if (goals === null && !isEditing) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <ToastStack toasts={toasts} onDismiss={dismiss} />
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

  // ── Derived values ─────────────────────────────────────────────────────────

  const weightFraction: number = (() => {
    if (goals === null || currentWeight === null) return 0
    const total = goals.initialWeight - goals.targetWeight
    if (total === 0) return 1
    const done = goals.initialWeight - currentWeight
    return done / total
  })()

  const waterFraction: number =
    goals !== null && goals.dailyWaterLiters > 0
      ? averageWater / goals.dailyWaterLiters
      : 0

  const workoutFraction: number = weeklyCompletionRate

  const showCongrats =
    goals !== null && currentWeight !== null && currentWeight <= goals.targetWeight

  const weightRemaining =
    goals !== null && currentWeight !== null && currentWeight > goals.targetWeight
      ? currentWeight - goals.targetWeight
      : null

  // IMC
  const heightCm = settings?.heightCm ?? null
  const bmiResult =
    currentWeight !== null && heightCm !== null
      ? calculateBMI(currentWeight, heightCm)
      : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white">Metas</h1>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-h-[44px] px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {/* Parabéns banner (Req 9.3) */}
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

      {/* Progresso (Req 9.1–9.2) */}
      {goals !== null && !isEditing && (
        <>
          {/* Cartão de peso (Req 9.2) */}
          <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
            <h2 className="text-base font-semibold text-white">Progresso de Peso</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-400">Inicial</p>
                <p className="text-lg font-bold text-white">{goals.initialWeight.toFixed(1)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Atual</p>
                <p className={`text-lg font-bold ${currentWeight !== null ? 'text-white' : 'text-gray-500'}`}>
                  {currentWeight !== null ? currentWeight.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Alvo</p>
                <p className="text-lg font-bold text-blue-400">{goals.targetWeight.toFixed(1)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
            </div>
            <ProgressBar
              value={weightFraction}
              variant={showCongrats ? 'green' : 'blue'}
              label="Progresso de peso"
            />
            {weightRemaining !== null && (
              <p className="text-xs text-gray-400 text-center">
                Faltam <span className="text-white font-medium">{weightRemaining.toFixed(1)} kg</span> para sua meta
              </p>
            )}
          </div>

          {/* Barras de progresso (Req 9.1) */}
          <section aria-label="Progresso atual">
            <h2 className="text-base font-semibold text-white mb-3">Progresso atual</h2>
            <div className="space-y-3">
              <ProgressCard
                label="Água diária (média 7 dias)"
                current={`${averageWater.toFixed(1)} L`}
                goal={`${goals.dailyWaterLiters.toFixed(1)} L`}
                fraction={waterFraction}
                variant={waterFraction >= 1 ? 'green' : 'blue'}
              />
              <ProgressCard
                label="Treinos esta semana"
                current={`${Math.round(workoutFraction * goals.weeklyWorkouts)} treinos`}
                goal={`${goals.weeklyWorkouts} treinos`}
                fraction={workoutFraction}
                variant={workoutFraction >= 1 ? 'green' : 'blue'}
              />
              <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-300">Meta de cardio semanal</span>
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

          {/* IMC (Req 9.4, 13.3, 13.4) */}
          <BMICard
            bmi={bmiResult?.value ?? null}
            classification={bmiResult?.classification ?? null}
            heightCm={heightCm}
          />

          {/* Metas definidas */}
          <section aria-label="Metas definidas">
            <h2 className="text-base font-semibold text-white mb-3">Metas definidas</h2>
            <dl className="rounded-2xl bg-gray-800 border border-gray-700 divide-y divide-gray-700">
              {[
                { label: 'Peso inicial', value: `${goals.initialWeight.toFixed(1)} kg` },
                { label: 'Peso alvo', value: `${goals.targetWeight.toFixed(1)} kg` },
                { label: 'Água diária', value: `${goals.dailyWaterLiters.toFixed(1)} L` },
                { label: 'Treinos por semana', value: String(goals.weeklyWorkouts) },
                { label: 'Cardio semanal', value: `${goals.weeklyCardioMinutes} min` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-gray-400">{label}</dt>
                  <dd className="text-sm font-medium text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}

      {/* Formulário de edição */}
      {isEditing && (
        <section
          aria-label="Editar metas"
          className="rounded-2xl bg-gray-800 border border-gray-700 p-4"
        >
          <h2 className="text-base font-semibold text-white mb-4">Editar metas</h2>
          <GoalsForm
            goals={goals ?? undefined}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </section>
      )}
    </div>
  )
}
