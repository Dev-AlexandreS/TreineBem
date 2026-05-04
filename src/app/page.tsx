'use client'

import { useDashboard } from '@/hooks/useDashboard'
import MetricCard from '@/components/cards/MetricCard'
import WeightChart from '@/components/charts/WeightChart'
import WorkoutFrequencyChart from '@/components/charts/WorkoutFrequencyChart'
import WaterChart from '@/components/charts/WaterChart'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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
    allLogs,
    isLoading,
  } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  const isRestDay = todayDayType === 'rest' || todayPlan === null

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Weight metrics */}
      <section aria-label="Métricas de peso">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Peso
        </h2>
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
      </section>

      {/* Activity metrics */}
      <section aria-label="Métricas de atividade">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Atividade
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            title="Streak"
            value={streak}
            unit="dias"
          />
          <MetricCard
            title="Semana"
            value={`${Math.round(weeklyCompletionRate * 100)}`}
            unit="%"
          />
          <MetricCard
            title="Água média"
            value={averageWater.toFixed(1)}
            unit="L"
          />
        </div>
      </section>

      {/* Today's workout */}
      <section aria-label="Treino do dia">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Hoje
        </h2>
        <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
          {isRestDay ? (
            <p className="text-gray-400 text-center py-2">Dia de descanso</p>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                  {todayDayType === 'fight' ? 'Luta' : 'Treino'}
                </span>
              </div>
              {todayPlan!.notes && (
                <p className="text-gray-300 text-sm mb-3">{todayPlan!.notes}</p>
              )}
              {todayPlan!.exercises.length > 0 ? (
                <ul className="space-y-1">
                  {todayPlan!.exercises.map((exercise) => (
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
          )}
        </div>
      </section>

      {/* Charts */}
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
    </div>
  )
}
