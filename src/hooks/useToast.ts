'use client'

import { useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
  duration: number
}

export interface UseToastReturn {
  toasts: ToastItem[]
  showSuccess: (message: string) => void
  showError: (message: string) => void
  dismiss: (id: string) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TOASTS = 3
const DEFAULT_SUCCESS_DURATION = 3000
const DEFAULT_ERROR_DURATION = 5000

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook centralizado para gerenciamento de toasts.
 * Suporta empilhamento (máx 3), duração diferenciada por tipo e dismiss manual.
 *
 * Requirements: 3.1, 3.2, 3.5, 16.6
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback(
    (message: string, type: 'success' | 'error', duration: number) => {
      const id = crypto.randomUUID()
      const newToast: ToastItem = { id, message, type, duration }

      setToasts((prev) => {
        // Se já temos MAX_TOASTS, remove o mais antigo (índice 0)
        const next = prev.length >= MAX_TOASTS ? prev.slice(1) : prev
        return [...next, newToast]
      })

      // Auto-dismiss após a duração configurada
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    },
    []
  )

  const showSuccess = useCallback(
    (message: string) => addToast(message, 'success', DEFAULT_SUCCESS_DURATION),
    [addToast]
  )

  const showError = useCallback(
    (message: string) => addToast(message, 'error', DEFAULT_ERROR_DURATION),
    [addToast]
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showSuccess, showError, dismiss }
}
