'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  /** Variante do botão de confirmação (padrão: 'danger') */
  variant?: 'danger' | 'primary'
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Diálogo de confirmação reutilizável para ações destrutivas ou importantes.
 * Extraído do plan/page.tsx para uso em múltiplas telas.
 *
 * Requirements: 7.8, 16.6, 16.8
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const confirmBtnClass =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-500 text-white'
      : 'bg-red-600 hover:bg-red-500 text-white'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
    >
      <div className="w-full max-w-sm rounded-2xl bg-gray-800 border border-gray-700 p-6 space-y-4">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-white"
        >
          {title}
        </h2>

        <p
          id="confirm-dialog-description"
          className="text-sm text-gray-400"
        >
          {description}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] rounded-lg border border-gray-700 bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
