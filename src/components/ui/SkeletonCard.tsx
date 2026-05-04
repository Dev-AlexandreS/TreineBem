'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkeletonCardProps {
  /** Número de linhas de texto simuladas (padrão: 2) */
  lines?: number
  /** Altura do card em px (padrão: 80) */
  height?: number
  /** Classe CSS adicional */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Placeholder animado exibido enquanto dados estão sendo carregados.
 * Usa animate-pulse para simular o formato dos cartões reais.
 *
 * Requirements: 2.1, 16.5
 */
export default function SkeletonCard({
  lines = 2,
  height = 80,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl bg-gray-800 border border-gray-700 p-4 animate-pulse ${className}`}
      style={{ minHeight: `${height}px` }}
    >
      {/* Linha de título simulada */}
      <div className="h-4 bg-gray-700 rounded-full w-2/5 mb-3" />

      {/* Linhas de conteúdo simuladas */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-700 rounded-full mb-2"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}
