'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayStatus = 'trained' | 'rest' | 'missed' | 'future'

export interface WeekDay {
  dayLabel: string  // 'Seg', 'Ter', etc.
  status: DayStatus
}

export interface WeeklyConsistencyIndicatorProps {
  /** Array de 7 status, índice 0 = segunda */
  days: WeekDay[]
  isPerfectWeek: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDotClass(status: DayStatus): string {
  switch (status) {
    case 'trained':
      return 'bg-green-500'
    case 'rest':
      return 'bg-gray-500'
    case 'missed':
      return 'bg-red-500'
    case 'future':
    default:
      return 'bg-gray-700'
  }
}

function getDotLabel(status: DayStatus): string {
  switch (status) {
    case 'trained':
      return 'Treinou'
    case 'rest':
      return 'Descanso'
    case 'missed':
      return 'Não treinou'
    case 'future':
    default:
      return 'Futuro'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Indicador visual de consistência semanal com 7 círculos coloridos.
 * Exibe badge "Semana Perfeita 🏆" quando todos os treinos foram realizados.
 *
 * Requirements: 12.1, 12.2, 12.3
 */
export default function WeeklyConsistencyIndicator({
  days,
  isPerfectWeek,
}: WeeklyConsistencyIndicatorProps) {
  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-white">Consistência Semanal</h2>
        {isPerfectWeek && (
          <span
            className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-3 py-1"
            aria-label="Semana Perfeita conquistada"
          >
            Semana Perfeita 🏆
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        {days.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full ${getDotClass(day.status)} transition-colors`}
              aria-label={`${day.dayLabel}: ${getDotLabel(day.status)}`}
              title={`${day.dayLabel}: ${getDotLabel(day.status)}`}
            />
            <span className="text-[10px] text-gray-500 font-medium">
              {day.dayLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" aria-hidden="true" />
          <span className="text-[10px] text-gray-500">Treinou</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" aria-hidden="true" />
          <span className="text-[10px] text-gray-500">Descanso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-[10px] text-gray-500">Não treinou</span>
        </div>
      </div>
    </div>
  )
}
