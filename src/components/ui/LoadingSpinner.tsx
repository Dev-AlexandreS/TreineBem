'use client'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="flex items-center justify-center"
    >
      <div
        className={[
          sizeClasses[size],
          'rounded-full',
          'border-gray-600',
          'border-t-blue-400',
          'animate-spin',
        ].join(' ')}
      />
      <span className="sr-only">Carregando...</span>
    </div>
  )
}
