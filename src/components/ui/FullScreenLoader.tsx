'use client'

// ─── Component ────────────────────────────────────────────────────────────────

interface FullScreenLoaderProps {
  /** Message shown below the spinner */
  message?: string
}

/**
 * Full-screen loading overlay with a centered spinner and optional message.
 * Used for auth flows (login, signup) and other long-running operations.
 */
export default function FullScreenLoader({ message }: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-label={message ?? 'Carregando'}
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm"
    >
      {/* Spinner */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <div className="w-14 h-14 rounded-full border-4 border-gray-700" />
        {/* Spinning arc */}
        <div className="absolute w-14 h-14 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" />
        {/* Inner dot */}
        <div className="absolute w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
      </div>

      {/* Message */}
      {message && (
        <p className="mt-4 text-sm font-medium text-gray-300 animate-pulse">
          {message}
        </p>
      )}

      <span className="sr-only">{message ?? 'Carregando...'}</span>
    </div>
  )
}
