'use client'

import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Ícone SVG ou emoji exibido acima da mensagem */
  icon?: React.ReactNode
  /** Mensagem explicativa exibida em text-gray-400 */
  message: string
  /** Botão de ação opcional */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Classe CSS adicional para o container */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Estado vazio reutilizável com ícone, mensagem e ação opcional.
 *
 * Requirements: 2.3, 2.4, 2.5, 2.6, 16.5
 */
export default function EmptyState({
  icon,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-12 px-4 text-center ${className}`}
    >
      {icon && (
        <div className="text-4xl text-gray-500" aria-hidden="true">
          {icon}
        </div>
      )}

      <p className="text-sm text-gray-400 max-w-xs">{message}</p>

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  )
}
