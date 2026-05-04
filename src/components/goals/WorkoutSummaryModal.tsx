'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutSummary {
  totalExercises: number
  completedExercises: number
  totalSets: number
  totalWeightKg: number
  estimatedDurationMin: number
}

export interface WorkoutSummaryModalProps {
  isOpen: boolean
  summary: WorkoutSummary
  onConfirm: () => void
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Modal de resumo do treino exibido antes de confirmar e salvar.
 *
 * Requirements: 6.8, 6.9, 16.6, 16.8
 */
export default function WorkoutSummaryModal({
  isOpen,
  summary,
  onConfirm,
  onClose,
}: WorkoutSummaryModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-summary-title"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70"
    >
      <div className="w-full max-w-sm rounded-2xl bg-gray-800 border border-gray-700 p-6 space-y-5">
        {/* Header */}
        <div>
          <h2
            id="workout-summary-title"
            className="text-lg font-bold text-white"
          >
            Resumo do Treino 💪
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Confira antes de salvar
          </p>
        </div>

        {/* Stats */}
        <dl className="rounded-xl bg-gray-700/50 divide-y divide-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-gray-400">Exercícios concluídos</dt>
            <dd className="text-sm font-semibold text-white">
              {summary.completedExercises} / {summary.totalExercises}
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-gray-400">Total de séries</dt>
            <dd className="text-sm font-semibold text-white">{summary.totalSets}</dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-gray-400">Carga total</dt>
            <dd className="text-sm font-semibold text-white">
              {summary.totalWeightKg.toFixed(0)} kg
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-gray-400">Duração estimada</dt>
            <dd className="text-sm font-semibold text-white">
              {summary.estimatedDurationMin} min
            </dd>
          </div>
        </dl>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-[48px] rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 transition-colors"
          >
            Confirmar e Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
