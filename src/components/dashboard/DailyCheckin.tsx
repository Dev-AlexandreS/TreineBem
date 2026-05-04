'use client'

import { useState, useEffect } from 'react'
import { validateCheckinWeight, validateCheckinWater } from '@/lib/validators/settings.validator'
import type { DailyLog } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyCheckinProps {
  /** Log do dia atual para pré-preencher os campos */
  todayLog: DailyLog | null
  onSave: (weight?: number, water?: number) => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Cartão de check-in diário rápido no Dashboard.
 * Permite registrar peso e água sem navegar para outra tela.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */
export default function DailyCheckin({ todayLog, onSave }: DailyCheckinProps) {
  const [weightStr, setWeightStr] = useState('')
  const [waterStr, setWaterStr] = useState('')
  const [weightError, setWeightError] = useState<string | null>(null)
  const [waterError, setWaterError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Pré-preencher campos quando todayLog existe (Req 10.4)
  useEffect(() => {
    if (todayLog?.weight !== undefined) {
      setWeightStr(String(todayLog.weight))
    }
    if (todayLog?.waterLiters !== undefined) {
      setWaterStr(String(todayLog.waterLiters))
    }
  }, [todayLog])

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSaveWeight() {
    const value = parseFloat(weightStr)
    const result = validateCheckinWeight(value)
    if (!result.valid) {
      setWeightError(result.error ?? 'Valor inválido.')
      return
    }
    setWeightError(null)
    setIsSaving(true)
    try {
      await onSave(value, undefined)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveWater() {
    const value = parseFloat(waterStr)
    const result = validateCheckinWater(value)
    if (!result.valid) {
      setWaterError(result.error ?? 'Valor inválido.')
      return
    }
    setWaterError(null)
    setIsSaving(true)
    try {
      await onSave(undefined, value)
    } finally {
      setIsSaving(false)
    }
  }

  function handleWeightChange(v: string) {
    setWeightStr(v)
    // Limpar erro ao editar (Req 10.6)
    if (weightError) setWeightError(null)
  }

  function handleWaterChange(v: string) {
    setWaterStr(v)
    // Limpar erro ao editar (Req 10.7)
    if (waterError) setWaterError(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-4">
      <h2 className="text-base font-semibold text-white">Check-in Diário</h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Peso */}
        <div className="space-y-1">
          <label
            htmlFor="checkin-weight"
            className="text-sm font-medium text-gray-400"
          >
            Peso (kg)
          </label>
          <div className="flex gap-2">
            <input
              id="checkin-weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={30}
              max={300}
              value={weightStr}
              onChange={(e) => handleWeightChange(e.target.value)}
              aria-invalid={weightError !== null}
              aria-describedby={weightError ? 'checkin-weight-error' : undefined}
              placeholder="Ex: 75.5"
              className={[
                'w-full rounded-lg bg-gray-700 border px-3 py-2 text-sm text-white',
                'placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                'min-h-[44px]',
                weightError ? 'border-red-500' : 'border-gray-600',
              ].join(' ')}
            />
          </div>
          {weightError && (
            <p
              id="checkin-weight-error"
              role="alert"
              className="text-xs text-red-400"
            >
              {weightError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveWeight}
            disabled={isSaving || weightStr === ''}
            className="w-full min-h-[36px] rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Salvar peso
          </button>
        </div>

        {/* Água */}
        <div className="space-y-1">
          <label
            htmlFor="checkin-water"
            className="text-sm font-medium text-gray-400"
          >
            Água (L)
          </label>
          <div className="flex gap-2">
            <input
              id="checkin-water"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              max={10}
              value={waterStr}
              onChange={(e) => handleWaterChange(e.target.value)}
              aria-invalid={waterError !== null}
              aria-describedby={waterError ? 'checkin-water-error' : undefined}
              placeholder="Ex: 2.5"
              className={[
                'w-full rounded-lg bg-gray-700 border px-3 py-2 text-sm text-white',
                'placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                'min-h-[44px]',
                waterError ? 'border-red-500' : 'border-gray-600',
              ].join(' ')}
            />
          </div>
          {waterError && (
            <p
              id="checkin-water-error"
              role="alert"
              className="text-xs text-red-400"
            >
              {waterError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveWater}
            disabled={isSaving || waterStr === ''}
            className="w-full min-h-[36px] rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Salvar água
          </button>
        </div>
      </div>
    </div>
  )
}
