'use client'

import { useState } from 'react'
import { validator } from '@/lib/validators'
import type { Exercise, MuscleGroup } from '@/types'

// ─── Muscle group options ─────────────────────────────────────────────────────

const MUSCLE_GROUP_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulder', label: 'Ombro' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'legs', label: 'Perna' },
  { value: 'abs', label: 'Abdômen' },
  { value: 'glutes', label: 'Glúteo' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'other', label: 'Outro' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExerciseFormProps {
  /** When provided, the form is in edit mode and pre-fills with this exercise */
  exercise?: Exercise
  onSave: (exercise: Exercise) => void
  onCancel: () => void
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  muscleGroup: string
  plannedSets: string
  plannedReps: string
  plannedWeight: string
  restSeconds: string
  notes: string
}

function initialState(exercise?: Exercise): FormState {
  if (exercise) {
    return {
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      plannedSets: String(exercise.plannedSets),
      plannedReps: exercise.plannedReps,
      plannedWeight: exercise.plannedWeight !== undefined ? String(exercise.plannedWeight) : '',
      restSeconds: exercise.restSeconds !== undefined ? String(exercise.restSeconds) : '',
      notes: exercise.notes ?? '',
    }
  }
  return {
    name: '',
    muscleGroup: '',
    plannedSets: '',
    plannedReps: '',
    plannedWeight: '',
    restSeconds: '',
    notes: '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExerciseForm({ exercise, onSave, onCancel }: ExerciseFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(exercise))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = exercise !== undefined

  // ── Field helpers ──────────────────────────────────────────────────────────

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
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

    const partial: Partial<Exercise> = {
      name: form.name,
      muscleGroup: form.muscleGroup as MuscleGroup,
      plannedSets: form.plannedSets !== '' ? Number(form.plannedSets) : undefined,
      plannedReps: form.plannedReps,
    }

    const result = validator.validateExercise(partial)

    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    const saved: Exercise = {
      id: exercise?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      muscleGroup: form.muscleGroup as MuscleGroup,
      plannedSets: Number(form.plannedSets),
      plannedReps: form.plannedReps.trim(),
      ...(form.plannedWeight !== '' && { plannedWeight: Number(form.plannedWeight) }),
      ...(form.restSeconds !== '' && { restSeconds: Number(form.restSeconds) }),
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
      aria-label={isEditMode ? 'Editar exercício' : 'Adicionar exercício'}
    >
      {/* Nome */}
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-300">
          Nome <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Ex: Supino reto"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.name ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Grupo muscular */}
      <div className="flex flex-col gap-1">
        <label htmlFor="muscleGroup" className="text-sm font-medium text-gray-300">
          Grupo muscular <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <select
          id="muscleGroup"
          name="muscleGroup"
          value={form.muscleGroup}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.muscleGroup}
          aria-describedby={errors.muscleGroup ? 'muscleGroup-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            form.muscleGroup ? 'text-white' : 'text-gray-500',
            errors.muscleGroup ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        >
          <option value="" disabled>
            Selecione um grupo muscular
          </option>
          {MUSCLE_GROUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-white bg-gray-800">
              {opt.label}
            </option>
          ))}
        </select>
        {errors.muscleGroup && (
          <p id="muscleGroup-error" role="alert" className="text-xs text-red-400">
            {errors.muscleGroup}
          </p>
        )}
      </div>

      {/* Séries previstas */}
      <div className="flex flex-col gap-1">
        <label htmlFor="plannedSets" className="text-sm font-medium text-gray-300">
          Séries previstas <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="plannedSets"
          name="plannedSets"
          type="number"
          min={1}
          max={20}
          value={form.plannedSets}
          onChange={handleChange}
          placeholder="Ex: 3"
          aria-required="true"
          aria-invalid={!!errors.plannedSets}
          aria-describedby={errors.plannedSets ? 'plannedSets-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.plannedSets ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.plannedSets && (
          <p id="plannedSets-error" role="alert" className="text-xs text-red-400">
            {errors.plannedSets}
          </p>
        )}
      </div>

      {/* Repetições previstas */}
      <div className="flex flex-col gap-1">
        <label htmlFor="plannedReps" className="text-sm font-medium text-gray-300">
          Repetições previstas <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="plannedReps"
          name="plannedReps"
          type="text"
          value={form.plannedReps}
          onChange={handleChange}
          placeholder='Ex: 10 ou 10–12'
          aria-required="true"
          aria-invalid={!!errors.plannedReps}
          aria-describedby={errors.plannedReps ? 'plannedReps-error' : undefined}
          className={[
            'rounded-lg bg-gray-800 border px-3 py-2 text-white placeholder-gray-500 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.plannedReps ? 'border-red-500' : 'border-gray-700',
          ].join(' ')}
        />
        {errors.plannedReps && (
          <p id="plannedReps-error" role="alert" className="text-xs text-red-400">
            {errors.plannedReps}
          </p>
        )}
      </div>

      {/* Carga (opcional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="plannedWeight" className="text-sm font-medium text-gray-300">
          Carga (kg) <span className="text-gray-500 text-xs font-normal">opcional</span>
        </label>
        <input
          id="plannedWeight"
          name="plannedWeight"
          type="number"
          min={0}
          step={0.5}
          value={form.plannedWeight}
          onChange={handleChange}
          placeholder="Ex: 60"
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Descanso (opcional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="restSeconds" className="text-sm font-medium text-gray-300">
          Descanso (segundos) <span className="text-gray-500 text-xs font-normal">opcional</span>
        </label>
        <input
          id="restSeconds"
          name="restSeconds"
          type="number"
          min={0}
          step={5}
          value={form.restSeconds}
          onChange={handleChange}
          placeholder="Ex: 90"
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Observações (opcional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-gray-300">
          Observações <span className="text-gray-500 text-xs font-normal">opcional</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          placeholder="Notas adicionais sobre o exercício..."
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[44px] rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 min-h-[44px] rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          {isEditMode ? 'Salvar alterações' : 'Adicionar exercício'}
        </button>
      </div>
    </form>
  )
}
