'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressBarProps {
  /** Fração 0–1 (clamped internamente para [0, 1]) */
  value: number
  /** Variante de cor da barra */
  variant?: 'blue' | 'green' | 'yellow' | 'red'
  /** Altura da barra em px (padrão: 8) */
  height?: number
  /** Label acessível para o progressbar (obrigatório para acessibilidade) */
  label: string
  /** Classe CSS adicional para o container */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Barra de progresso reutilizável com suporte a variantes de cor e acessibilidade.
 *
 * Requirements: 9.1, 16.5, 16.6
 */
export default function ProgressBar({
  value,
  variant = 'blue',
  height = 8,
  label,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value))
  const pct = Math.round(clamped * 100)

  const fillColour =
    variant === 'green'
      ? 'bg-green-500'
      : variant === 'yellow'
      ? 'bg-yellow-500'
      : variant === 'red'
      ? 'bg-red-500'
      : 'bg-blue-500'

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full rounded-full overflow-hidden bg-gray-700 ${className}`}
      style={{ height: `${height}px` }}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillColour}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
