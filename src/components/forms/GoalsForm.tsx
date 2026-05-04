'use client'

import { useState } from 'react'
import { validator } from '@/lib/validators'
import type { Goals } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoalsFormProps {
  /** When provided, pre-fills the form with existing goals */
  goals?: Goals
  onSave: (goals: Goals) => void
  onCancel?: () => void
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  initialWeight: string
  targetWeight: string
  dailyWaterLiters: string
  weeklyWorkouts: string
  weeklyCardioMinutes: string
}

function initialState(goals?: Goals): FormState {
  if (goals) {
    return {
      initialWeight: String(goals.initialWeight),
      targetWeight: String(goals.targetWeight),
      dailyWaterLiters: String(goals.dailyWaterLiters),
      weeklyWorkouts: String(goals.weeklyWorkouts),
      weeklyCardioMinutes: String(goals.weeklyCardioMinutes),
    }
  }
  return {
    initialWeight: '',
    targetWeight: '',
    dailyWaterLiters: '',
    weeklyWorkouts: '',
    weeklyCardioMinutes: '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Form for creating or editing fitness goals.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export default function GoalsForm({ goals, onSave, onCancel }: GoalsFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(goals))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = goals !== undefined

  // ── Field helpers ──────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear the error for this field as the user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const partial: Partial<Goals> = {
      initialWeight: form.initialWeight !== '' ? Number(form.initialWeight) : undefined,
      targetWeight: form.targetWeight !== '' ? Number(form.targetWeight) : undefined,
      dailyWaterLiters: form.dailyWaterLiters !== '' ? Number(form.dailyWaterLiters) : undefined,
      weeklyWorkouts: form.weeklyWorkouts !== '' ? Number(form.weeklyWorkouts) : undefined,
      weeklyCardioMinutes:
        form.weeklyCardioMinutes !== '' ? Number(form.weeklyCardioMinutes) : undefined,
    }

    const result = validator.validateGoals(partial)

    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    const saved: Goals = {
      initialWeight: Number(form.initialWeight),
      targetWeight: Number(form.targetWeight),
      dailyWaterLiters: Number(form.dailyWaterLiters),
      weeklyWorkouts: Number(form.weeklyWorkouts),
      weeklyCardioMinutes: Number(form.weeklyCardioMinutes),
    }

    setErrors({})
    onSave(saved)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
      aria-label={isEditMode ? 'Editar metas' : 'Definir metas'}
    >
      {/* Peso inicial */}
      <div className="flex flex-col gap-1">
        <label htmlFor="initialWeight" className="text-sm font-medium text-gray-300">
          Peso inicial (kg){' '}
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="initialWeight"
          name="initialWeight"
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={form.initialWeight}
          onChange={handleChange}
          placeholder="Ex: 80.0"
          aria-required="true"
          aria-invalid={!!errors.initialWeight}
          aria-describedby={errors.initialWeight ? 'initialWeight-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.initialWeight ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.initialWeight && (
          <p id="initialWeight-error" role="alert" className="text-xs text-red-400">
            {errors.initialWeight}
          </p>
        )}
      </div>

      {/* Peso alvo */}
      <div className="flex flex-col gap-1">
        <label htmlFor="targetWeight" className="text-sm font-medium text-gray-300">
          Peso alvo (kg){' '}
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="targetWeight"
          name="targetWeight"
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={form.targetWeight}
          onChange={handleChange}
          placeholder="Ex: 70.0"
          aria-required="true"
          aria-invalid={!!errors.targetWeight}
          aria-describedby={errors.targetWeight ? 'targetWeight-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.targetWeight ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.targetWeight && (
          <p id="targetWeight-error" role="alert" className="text-xs text-red-400">
            {errors.targetWeight}
          </p>
        )}
      </div>

      {/* Meta de água diária */}
      <div className="flex flex-col gap-1">
        <label htmlFor="dailyWaterLiters" className="text-sm font-medium text-gray-300">
          Meta de água diária (L){' '}
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="dailyWaterLiters"
          name="dailyWaterLiters"
          type="number"
          min={0.5}
          max={10}
          step={0.1}
          value={form.dailyWaterLiters}
          onChange={handleChange}
          placeholder="Ex: 2.5"
          aria-required="true"
          aria-invalid={!!errors.dailyWaterLiters}
          aria-describedby={errors.dailyWaterLiters ? 'dailyWaterLiters-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.dailyWaterLiters ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.dailyWaterLiters && (
          <p id="dailyWaterLiters-error" role="alert" className="text-xs text-red-400">
            {errors.dailyWaterLiters}
          </p>
        )}
      </div>

      {/* Meta de treinos por semana */}
      <div className="flex flex-col gap-1">
        <label htmlFor="weeklyWorkouts" className="text-sm font-medium text-gray-300">
          Meta de treinos por semana{' '}
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="weeklyWorkouts"
          name="weeklyWorkouts"
          type="number"
          min={1}
          max={7}
          step={1}
          value={form.weeklyWorkouts}
          onChange={handleChange}
          placeholder="Ex: 4"
          aria-required="true"
          aria-invalid={!!errors.weeklyWorkouts}
          aria-describedby={errors.weeklyWorkouts ? 'weeklyWorkouts-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.weeklyWorkouts ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.weeklyWorkouts && (
          <p id="weeklyWorkouts-error" role="alert" className="text-xs text-red-400">
            {errors.weeklyWorkouts}
          </p>
        )}
      </div>

      {/* Meta de cardio semanal */}
      <div className="flex flex-col gap-1">
        <label htmlFor="weeklyCardioMinutes" className="text-sm font-medium text-gray-300">
          Meta de cardio semanal (minutos){' '}
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="weeklyCardioMinutes"
          name="weeklyCardioMinutes"
          type="number"
          min={0}
          max={600}
          step={1}
          value={form.weeklyCardioMinutes}
          onChange={handleChange}
          placeholder="Ex: 120"
          aria-required="true"
          aria-invalid={!!errors.weeklyCardioMinutes}
          aria-describedby={errors.weeklyCardioMinutes ? 'weeklyCardioMinutes-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.weeklyCardioMinutes ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.weeklyCardioMinutes && (
          <p id="weeklyCardioMinutes-error" role="alert" className="text-xs text-red-400">
            {errors.weeklyCardioMinutes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="flex-1 min-h-[44px] rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          {isEditMode ? 'Salvar alterações' : 'Salvar metas'}
        </button>
      </div>
    </form>
  )
}
