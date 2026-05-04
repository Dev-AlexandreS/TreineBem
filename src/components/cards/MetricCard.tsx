'use client'

interface MetricCardProps {
  title: string
  value: string | number | null
  unit?: string
  className?: string
}

export default function MetricCard({ title, value, unit, className = '' }: MetricCardProps) {
  const displayValue = value === null || value === undefined ? '—' : value

  return (
    <div
      className={`rounded-2xl bg-gray-800 border border-gray-700 p-4 flex flex-col gap-1 ${className}`}
    >
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {title}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{displayValue}</span>
        {unit && value !== null && value !== undefined && (
          <span className="text-sm text-blue-400">{unit}</span>
        )}
      </div>
    </div>
  )
}
