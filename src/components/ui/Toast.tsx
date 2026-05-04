'use client'

import { useEffect } from 'react'
import type { ToastItem } from '@/hooks/useToast'

// ─── Single Toast Item ────────────────────────────────────────────────────────

export interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  /** Duração em ms antes do auto-close (padrão: 3000 para sucesso, 5000 para erro) */
  duration?: number
}

export function ToastSingle({ message, type, onClose, duration }: ToastProps) {
  const autoCloseDuration = duration ?? (type === 'success' ? 3000 : 5000)

  useEffect(() => {
    const timer = setTimeout(onClose, autoCloseDuration)
    return () => clearTimeout(timer)
  }, [onClose, autoCloseDuration])

  const isSuccess = type === 'success'

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'text-sm font-medium text-white',
        'min-w-[240px] max-w-[90vw]',
        isSuccess ? 'bg-green-600' : 'bg-red-600',
      ].join(' ')}
    >
      {/* Icon */}
      {isSuccess ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 shrink-0"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}

      <span className="flex-1">{message}</span>

      {/* Close button */}
      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Fechar notificação"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

// ─── Toast Stack (multi-toast) ────────────────────────────────────────────────

export interface ToastStackProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

/**
 * Renderiza uma pilha de toasts empilhados verticalmente.
 * Posicionamento: canto superior direito em desktop, parte inferior centralizada em mobile.
 *
 * Requirements: 3.3, 3.4, 3.5
 */
export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="assertive"
      aria-atomic="false"
      className={[
        'fixed z-[100] flex flex-col gap-2',
        // Mobile: parte inferior centralizada
        'bottom-20 left-1/2 -translate-x-1/2',
        // Desktop: canto superior direito
        'md:bottom-auto md:top-4 md:right-4 md:left-auto md:translate-x-0',
        'md:items-end',
      ].join(' ')}
    >
      {toasts.map((toast) => (
        <ToastSingle
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

// ─── Default export (backward compat) ────────────────────────────────────────

/**
 * Componente Toast legado — mantido para compatibilidade com código existente.
 * Para novos usos, prefira `useToast` + `ToastStack`.
 */
export default function Toast({ message, type, onClose, duration }: ToastProps) {
  return (
    <div
      className={[
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-[100]',
        'md:bottom-auto md:top-4 md:right-4 md:left-auto md:translate-x-0',
      ].join(' ')}
    >
      <ToastSingle
        message={message}
        type={type}
        onClose={onClose}
        duration={duration}
      />
    </div>
  )
}
