'use client'

import { useState } from 'react'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import ExerciseForm from '@/components/forms/ExerciseForm'
import type { DayOfWeek, DayType, Exercise } from '@/types'

// ─── Day metadata ─────────────────────────────────────────────────────────────

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

const DAY_TYPE_LABELS: Record<DayType, string> = {
  workout: 'Treino',
  fight: 'Luta',
  rest: 'Descanso',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const { weeklyPlan, addExercise, updateExercise, removeExercise, reorderExercises, setDayType } =
    useWeeklyPlan()

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday')
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const dayPlan = weeklyPlan?.[selectedDay]
  const exercises = dayPlan?.exercises ?? []
  const dayType = dayPlan?.dayType ?? 'workout'

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSaveExercise(exercise: Exercise) {
    if (editingExercise) {
      updateExercise(selectedDay, exercise)
    } else {
      addExercise(selectedDay, exercise)
    }
    setShowForm(false)
    setEditingExercise(undefined)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingExercise(undefined)
  }

  function handleEditExercise(exercise: Exercise) {
    setEditingExercise(exercise)
    setShowForm(true)
  }

  function handleAddExercise() {
    setEditingExercise(undefined)
    setShowForm(true)
  }

  function handleConfirmRemove(id: string) {
    setConfirmRemoveId(id)
  }

  function handleRemoveConfirmed() {
    if (confirmRemoveId) {
      removeExercise(selectedDay, confirmRemoveId)
      setConfirmRemoveId(null)
    }
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const ids = exercises.map((e) => e.id)
    const next = [...ids]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    reorderExercises(selectedDay, next)
  }

  function handleMoveDown(index: number) {
    if (index === exercises.length - 1) return
    const ids = exercises.map((e) => e.id)
    const next = [...ids]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    reorderExercises(selectedDay, next)
  }

  function handleSetDayType(type: DayType) {
    setDayType(selectedDay, type)
    if (showForm) {
      setShowForm(false)
      setEditingExercise(undefined)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Plano Semanal</h1>

      {/* Day selector */}
      <section aria-label="Selecionar dia da semana">
        <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Dias da semana">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day.value
            const plan = weeklyPlan?.[day.value]
            const type = plan?.dayType ?? 'workout'
            return (
              <button
                key={day.value}
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedDay(day.value)
                  setShowForm(false)
                  setEditingExercise(undefined)
                  setConfirmRemoveId(null)
                }}
                className={[
                  'flex flex-col items-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0',
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-100',
                ].join(' ')}
              >
                <span>{day.label}</span>
                {type !== 'workout' && (
                  <span
                    className={[
                      'text-[10px] font-semibold',
                      type === 'rest' ? 'text-gray-400' : 'text-yellow-400',
                      isSelected ? 'text-white opacity-80' : '',
                    ].join(' ')}
                  >
                    {DAY_TYPE_LABELS[type]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Day type controls */}
      <section aria-label="Tipo do dia">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400 mr-1">Tipo do dia:</span>
          {(['workout', 'fight', 'rest'] as DayType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleSetDayType(type)}
              aria-pressed={dayType === type}
              className={[
                'min-h-[44px] min-w-[44px] px-4 rounded-lg text-sm font-medium transition-colors',
                dayType === type
                  ? type === 'rest'
                    ? 'bg-gray-600 text-white'
                    : type === 'fight'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-100',
              ].join(' ')}
            >
              {DAY_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      {/* Exercise list or rest/fight message */}
      <section aria-label={`Exercícios de ${DAYS.find((d) => d.value === selectedDay)?.label}`}>
        {dayType === 'rest' ? (
          <div className="rounded-2xl bg-gray-800 border border-gray-700 p-6 text-center">
            <p className="text-gray-400">Dia de descanso — sem exercícios.</p>
          </div>
        ) : (
          <>
            {/* Exercise list */}
            {exercises.length === 0 ? (
              <div className="rounded-2xl bg-gray-800 border border-gray-700 p-6 text-center">
                <p className="text-gray-400 text-sm">Nenhum exercício cadastrado para este dia.</p>
              </div>
            ) : (
              <ul className="space-y-2" aria-label="Lista de exercícios">
                {exercises.map((exercise, index) => (
                  <li
                    key={exercise.id}
                    className="rounded-xl bg-gray-800 border border-gray-700 p-3 flex items-center gap-3"
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        aria-label={`Mover ${exercise.name} para cima`}
                        className="min-h-[22px] min-w-[22px] flex items-center justify-center rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === exercises.length - 1}
                        aria-label={`Mover ${exercise.name} para baixo`}
                        className="min-h-[22px] min-w-[22px] flex items-center justify-center rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    {/* Exercise info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{exercise.name}</p>
                      <p className="text-gray-400 text-xs">
                        {exercise.plannedSets}×{exercise.plannedReps}
                        {exercise.plannedWeight !== undefined && ` · ${exercise.plannedWeight} kg`}
                        {exercise.restSeconds !== undefined && ` · ${exercise.restSeconds}s`}
                      </p>
                    </div>

                    {/* Edit / Remove buttons */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEditExercise(exercise)}
                        aria-label={`Editar ${exercise.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleConfirmRemove(exercise.id)}
                        aria-label={`Remover ${exercise.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Add exercise button (only when form is not open) */}
            {!showForm && (
              <button
                onClick={handleAddExercise}
                className="mt-3 w-full min-h-[44px] rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm font-medium hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adicionar exercício
              </button>
            )}
          </>
        )}
      </section>

      {/* Exercise form (add / edit) */}
      {showForm && (
        <section
          aria-label={editingExercise ? 'Editar exercício' : 'Novo exercício'}
          className="rounded-2xl bg-gray-800 border border-gray-700 p-4"
        >
          <h2 className="text-base font-semibold text-white mb-4">
            {editingExercise ? 'Editar exercício' : 'Novo exercício'}
          </h2>
          <ExerciseForm
            exercise={editingExercise}
            onSave={handleSaveExercise}
            onCancel={handleCancelForm}
          />
        </section>
      )}

      {/* Remove confirmation dialog */}
      {confirmRemoveId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        >
          <div className="w-full max-w-sm rounded-2xl bg-gray-800 border border-gray-700 p-6 space-y-4">
            <h2 id="confirm-remove-title" className="text-base font-semibold text-white">
              Remover exercício?
            </h2>
            <p className="text-sm text-gray-400">
              Esta ação não pode ser desfeita. Deseja continuar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemoveId(null)}
                className="flex-1 min-h-[44px] rounded-lg border border-gray-700 bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveConfirmed}
                className="flex-1 min-h-[44px] rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
