'use client'

import Link from 'next/link'
import { useDashboard } from '@/hooks/useDashboard'
import { useToast } from '@/hooks/useToast'
import MetricCard from '@/components/cards/MetricCard'
import WeightChart from '@/components/charts/WeightChart'
import WorkoutFrequencyChart from '@/components/charts/WorkoutFrequencyChart'
import WaterChart from '@/components/charts/WaterChart'
import SkeletonCard from '@/components/ui/SkeletonCard'
import EmptyState from '@/components/ui/EmptyState'
import { ToastStack } from '@/components/ui/Toast'
import DailyCheckin from '@/components/dashboard/DailyCheckin'
import MotivationalCard from '@/components/dashboard/MotivationalCard'
import WeeklyConsistencyIndicator from '@/components/dashboard/WeeklyConsistencyIndicator'
import { getMotivationalMessage } from '@/lib/calculators/motivational'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    currentWeight,
    targetWeight,
    weightLost,
    streak,
    weeklyCompletionRate,
    averageWater,
    todayPlan,
    todayDayType,
    todayLog,
    allLogs,
    goals,
    weekSummary,
    weekConsistencyDays,
    isPerfectWeekResult,
    isLoading,
    saveDailyCheckin,
  } = useDashboard()

  const { toasts, showSuccess, showError, dismiss } = useToast()

  const todayISO = getTodayISO()
  const motivationalMessage = getMotivationalMessage(todayISO)

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-700 rounded-full w-1/3 animate-pulse" />
        <SkeletonCard lines={2} height={100} />
        <SkeletonCard lines={3} height={120} />
        <SkeletonCard lines={2} height={80} />
      </div>
    )
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleCheckinSave(weight?: number, water?: number) {
    try {
      await saveDailyCheckin(weight, water)
      showSuccess(
        weight !== undefined
          ? `Peso ${weight.toFixed(1)} kg registrado!`
          : `Água ${water?.toFixed(1)} L registrada!`
      )
    } catch {
      showError('Erro ao salvar check-in. Tente novamente.')
    }
  }

  const isRestDay = todayDayType === 'rest'
  const isFightDay = todayDayType === 'fight'

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5 pb-24">
      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Mensagem motivacional (Req 11) */}
      <MotivationalCard message={motivationalMessage} />

      {/* Check-in diário (Req 10) */}
      <DailyCheckin todayLog={todayLog} onSave={handleCheckinSave} />

      {/* Métricas principais (Req 5.1) */}
      <section aria-label="Métricas de peso">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Peso
        </h2>
        {currentWeight === null && goals === null ? (
          <EmptyState
            icon="⚖️"
            message="Nenhum dado registrado ainda. Comece registrando seu treino de hoje!"
            action={{ label: 'Ir para Treino', href: '/workout' }}
          />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              title="Peso atual"
              value={currentWeight !== null ? currentWeight.toFixed(1) : null}
              unit="kg"
            />
            <MetricCard
              title="Meta de peso"
              value={targetWeight !== null ? targetWeight.toFixed(1) : null}
              unit="kg"
            />
            <MetricCard
              title="Peso perdido"
              value={weightLost !== null ? weightLost.toFixed(1) : null}
              unit="kg"
            />
          </div>
        )}
      </section>

      {/* Métricas de atividade */}
      <section aria-label="Métricas de atividade">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Atividade
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard title="Streak" value={streak} unit="dias" />
          <MetricCard
            title="Semana"
            value={`${Math.round(weeklyCompletionRate * 100)}`}
            unit="%"
          />
          <MetricCard title="Água média" value={averageWater.toFixed(1)} unit="L" />
        </div>
      </section>

      {/* CTA metas (Req 5.10) */}
      {goals === null && (
        <div className="rounded-2xl bg-gray-800 border border-blue-700/40 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Defina suas metas</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure peso alvo, água e treinos semanais.
            </p>
          </div>
          <Link
            href="/goals"
            className="shrink-0 min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            Definir
          </Link>
        </div>
      )}

      {/* Treino de hoje (Req 5.2–5.4) */}
      <section aria-label="Treino de hoje">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Hoje
        </h2>
        <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
          {isRestDay ? (
            <p className="text-gray-400 text-center py-2">Dia de descanso 🛌</p>
          ) : isFightDay ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥊</span>
              <div>
                <p className="text-white font-semibold">Dia de Luta</p>
                {todayPlan?.notes && (
                  <p className="text-sm text-gray-400 mt-0.5">{todayPlan.notes}</p>
                )}
              </div>
            </div>
          ) : todayPlan !== null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                  Treino
                </span>
                <Link
                  href="/workout"
                  className="min-h-[36px] px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  Ir para Treino
                </Link>
              </div>
              {todayPlan.exercises.length > 0 ? (
                <ul className="space-y-1">
                  {todayPlan.exercises.map((exercise) => (
                    <li
                      key={exercise.id}
                      className="text-sm text-gray-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      {exercise.name} — {exercise.plannedSets}×{exercise.plannedReps}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">Sem exercícios cadastrados</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center">
              Configure seu plano semanal para ver o treino de hoje.
            </p>
          )}
        </div>
      </section>

      {/* Consistência semanal (Req 12) */}
      {weekConsistencyDays.length > 0 && (
        <WeeklyConsistencyIndicator
          days={weekConsistencyDays}
          isPerfectWeek={isPerfectWeekResult}
        />
      )}

      {/* Resumo semanal (Req 5.5) */}
      {weekSummary !== null && (
        <section aria-label="Resumo semanal">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Resumo Semanal
          </h2>
          <div className="rounded-2xl bg-gray-800 border border-gray-700 divide-y divide-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-400">Treinos realizados</span>
              <span className="text-sm font-medium text-white">
                {weekSummary.trainedCount} / {weekSummary.plannedCount}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-400">Média de água</span>
              <span className="text-sm font-medium text-white">
                {weekSummary.averageWater.toFixed(1)} L
              </span>
            </div>
            {weekSummary.weekStartWeight !== null && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-400">Peso na semana</span>
                <span className="text-sm font-medium text-white">
                  {weekSummary.weekStartWeight.toFixed(1)} →{' '}
                  {weekSummary.currentWeight?.toFixed(1) ?? '—'} kg
                  {weekSummary.weightDiff !== null && (
                    <span
                      className={
                        weekSummary.weightDiff <= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'
                      }
                    >
                      ({weekSummary.weightDiff > 0 ? '+' : ''}
                      {weekSummary.weightDiff.toFixed(1)})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gráficos (Req 5.6–5.8) */}
      {allLogs.length > 0 && (
        <>
          <section aria-label="Gráficos de evolução">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Evolução do peso
            </h2>
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
              <WeightChart logs={allLogs} />
            </div>
          </section>

          <section aria-label="Frequência de treinos">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Frequência de treinos
            </h2>
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
              <WorkoutFrequencyChart logs={allLogs} />
            </div>
          </section>

          <section aria-label="Consumo de água">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Consumo de água (últimos 7 dias)
            </h2>
            <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
              <WaterChart logs={allLogs} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
