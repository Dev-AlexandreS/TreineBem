'use client'

import { useState } from 'react'
import { validator } from '@/lib/validators'
import type { DailyLog, ISODateString } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date as an ISO 8601 string (YYYY-MM-DD). */
function getTodayDate(): ISODateString {
  return new Date().toISOString().split('T')[0]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DailyLogFormProps {
  /** When provided, the form is in edit mode and pre-fills with this log */
  log?: DailyLog
  /** Pre-select a specific date; falls back to today if not provided */
  date?: ISODateString
  onSave: (log: DailyLog) => void
  onCancel?: () => void
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  date: string
  weight: string
  waterLiters: string
  trained: boolean | null
  followedPlan: boolean | null
  didSomethingDifferent: boolean | null
  differentDescription: string
  notes: string
}

function initialState(log?: DailyLog, date?: ISODateString): FormState {
  if (log) {
    return {
      date: log.date,
      weight: log.weight !== undefined ? String(log.weight) : '',
      waterLiters: log.waterLiters !== undefined ? String(log.waterLiters) : '',
      trained: log.trained,
      followedPlan: log.followedPlan,
      didSomethingDifferent: log.didSomethingDifferent,
      differentDescription: log.differentDescription ?? '',
      notes: log.notes ?? '',
    }
  }
  return {
    date: date ?? getTodayDate(),
    weight: '',
    waterLiters: '',
    trained: null,
    followedPlan: null,
    didSomethingDifferent: null,
    differentDescription: '',
    notes: '',
  }
}

// ─── Boolean toggle component ─────────────────────────────────────────────────

interface BooleanToggleProps {
  id: string
  label: string
  required?: boolean
  value: boolean | null
  onChange: (value: boolean) => void
  error?: string
}

function BooleanToggle({ id, label, required, value, onChange, error }: BooleanToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-300">
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <div className="flex gap-3" role="group" aria-label={label}>
        <button
          type="button"
          id={`${id}-yes`}
          aria-pressed={value === true}
          onClick={() => onChange(true)}
          className={[
            'flex-1 min-h-[44px] rounded-lg border text-sm font-medium transition-colors',
            value === true
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white',
          ].join(' ')}
        >
          Sim
        </button>
        <button
          type="button"
          id={`${id}-no`}
          aria-pressed={value === false}
          onClick={() => onChange(false)}
          className={[
            'flex-1 min-h-[44px] rounded-lg border text-sm font-medium transition-colors',
            value === false
              ? 'bg-gray-600 border-gray-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white',
          ].join(' ')}
        >
          Não
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DailyLogForm({ log, date, onSave, onCancel }: DailyLogFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(log, date))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = log !== undefined

  // ── Field helpers ──────────────────────────────────────────────────────────

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function handleBooleanChange(field: keyof FormState, value: boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const partial: Partial<DailyLog> = {
      date: form.date,
      trained: form.trained ?? undefined,
      followedPlan: form.followedPlan ?? undefined,
      didSomethingDifferent: form.didSomethingDifferent ?? undefined,
    }

    if (form.weight !== '') {
      partial.weight = Number(form.weight)
    }
    if (form.waterLiters !== '') {
      partial.waterLiters = Number(form.waterLiters)
    }

    const result = validator.validateDailyLog(partial)

    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    const saved: DailyLog = {
      date: form.date,
      trained: form.trained as boolean,
      followedPlan: form.followedPlan as boolean,
      didSomethingDifferent: form.didSomethingDifferent as boolean,
      ...(form.weight !== '' && { weight: Number(form.weight) }),
      ...(form.waterLiters !== '' && { waterLiters: Number(form.waterLiters) }),
      ...(form.didSomethingDifferent && form.differentDescription.trim() !== '' && {
        differentDescription: form.differentDescription.trim(),
      }),
      ...(form.notes.trim() !== '' && { notes: form.notes.trim() }),
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
      aria-label={isEditMode ? 'Editar registro diário' : 'Novo registro diário'}
    >
      {/* Data */}
      <div className="flex flex-col gap-1">
        <label htmlFor="date" className="text-sm font-medium text-gray-300">
          Data <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white text-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.date ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.date && (
          <p id="date-error" role="alert" className="text-xs text-red-400">
            {errors.date}
          </p>
        )}
      </div>

      {/* Peso (opcional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="weight" className="text-sm font-medium text-gray-300">
          Peso do dia (kg){' '}
          <span className="text-gray-500 text-xs font-normal">opcional</span>
        </label>
        <input
          id="weight"
          name="weight"
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={form.weight}
          onChange={handleChange}
          placeholder="Ex: 75.5"
          aria-invalid={!!errors.weight}
          aria-describedby={errors.weight ? 'weight-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.weight ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.weight && (
          <p id="weight-error" role="alert" className="text-xs text-red-400">
            {errors.weight}
          </p>
        )}
      </div>

      {/* Água (opcional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="waterLiters" className="text-sm font-medium text-gray-300">
          Água consumida (L){' '}
          <span className="text-gray-500 text-xs font-normal">opcional</span>
        </label>
        <input
          id="waterLiters"
          name="waterLiters"
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={form.waterLiters}
          onChange={handleChange}
          placeholder="Ex: 2.5"
          aria-invalid={!!errors.waterLiters}
          aria-describedby={errors.waterLiters ? 'waterLiters-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.waterLiters ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.waterLiters && (
          <p id="waterLiters-error" role="alert" className="text-xs text-red-400">
            {errors.waterLiters}
          </p>
        )}
      </div>

      {/* Treinou hoje */}
      <BooleanToggle
        id="trained"
        label="Treinou hoje"
        required
        value={form.trained}
        onChange={(v) => handleBooleanChange('trained', v)}
        error={errors.trained}
      />

      {/* Executou treino previsto */}
      <BooleanToggle
        id="followedPlan"
        label="Executou treino previsto"
        required
        value={form.followedPlan}
        onChange={(v) => handleBooleanChange('followedPlan', v)}
        error={errors.followedPlan}
      />

      {/* Fez algo diferente */}
      <BooleanToggle
        id="didSomethingDifferent"
        label="Fez algo diferente"
        required
        value={form.didSomethingDifferent}
        onChange={(v) => handleBooleanChange('didSomethingDifferent', v)}
        error={errors.didSomethingDifferent}
      />

      {/* Descrição condicional — aparece quando "Fez algo diferente" = Sim */}
      {form.didSomethingDifferent === true && (
        <div className="flex flex-col gap-1">
          <label htmlFor="differentDescription" className="text-sm font-medium text-gray-300">
            Descreva o que foi diferente{' '}
            <span className="text-gray-500 text-xs font-normal">opcional</span>
          </label>
          <textarea
            id="differentDescription"
            name="differentDescription"
            rows={3}
            value={form.differentDescription}
            onChange={handleChange}
            placeholder="Ex: Fiz uma aula de yoga no lugar do treino habitual..."
            className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {/* Observações (opcional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-gray-300">
          Observações{' '}
          <span className="text-gray-500 text-xs font-normal">opcional</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          placeholder="Notas adicionais sobre o dia..."
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
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
          {isEditMode ? 'Salvar alterações' : 'Salvar registro'}
        </button>
      </div>
    </form>
  )
}
