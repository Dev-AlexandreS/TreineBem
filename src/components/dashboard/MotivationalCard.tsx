'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MotivationalCardProps {
  message: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Cartão de mensagem motivacional diária.
 * Exibido no Dashboard com borda sutil e texto em itálico.
 *
 * Requirements: 11.1, 11.4
 */
export default function MotivationalCard({ message }: MotivationalCardProps) {
  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 px-4 py-3">
      <p className="text-sm italic text-gray-300 leading-relaxed">
        &ldquo;{message}&rdquo;
      </p>
    </div>
  )
}
