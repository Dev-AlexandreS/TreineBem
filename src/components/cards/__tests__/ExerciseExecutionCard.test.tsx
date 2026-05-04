import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExerciseExecutionCard from '../ExerciseExecutionCard'
import type { Exercise, ExerciseExecution } from '@/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseExercise: Exercise = {
  id: 'ex-1',
  name: 'Supino reto',
  muscleGroup: 'chest',
  plannedSets: 3,
  plannedReps: '10–12',
  plannedWeight: 60,
}

const baseExecution: ExerciseExecution = {
  id: 'exec-1',
  date: '2024-06-01',
  exerciseId: 'ex-1',
  exerciseName: 'Supino reto',
  setsCompleted: 3,
  repsCompleted: 10,
  weightUsed: 60,
  completed: false,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExerciseExecutionCard', () => {
  const onChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Requirement 6.1: planned values displayed as reference ────────────────

  it('displays planned sets and reps as reference', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
      />
    )

    expect(screen.getByText(/3×10–12/)).toBeInTheDocument()
  })

  it('displays planned weight as reference when provided', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
      />
    )

    expect(screen.getByText(/60 kg/)).toBeInTheDocument()
  })

  it('does not display weight reference when plannedWeight is not set', () => {
    const exerciseNoWeight: Exercise = { ...baseExercise, plannedWeight: undefined }

    render(
      <ExerciseExecutionCard
        exercise={exerciseNoWeight}
        onChange={onChange}
      />
    )

    // "Carga:" label in the reference section should not appear
    expect(screen.queryByText(/^Carga:/)).not.toBeInTheDocument()
  })

  // ── Requirement 5.3 / 6.6: visual highlight when completed ───────────────

  it('applies green highlight when execution is marked as completed', () => {
    const completedExecution: ExerciseExecution = { ...baseExecution, completed: true }

    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={completedExecution}
        onChange={onChange}
      />
    )

    const card = screen.getByTestId('exercise-execution-card')
    expect(card).toHaveAttribute('data-completed', 'true')
    expect(card.className).toMatch(/green/)
  })

  it('does not apply green highlight when execution is not completed', () => {
    const notCompletedExecution: ExerciseExecution = { ...baseExecution, completed: false }

    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={notCompletedExecution}
        onChange={onChange}
      />
    )

    const card = screen.getByTestId('exercise-execution-card')
    expect(card).toHaveAttribute('data-completed', 'false')
    expect(card.className).not.toMatch(/green/)
  })

  it('shows the "Concluído" badge when completed is true', () => {
    const completedExecution: ExerciseExecution = { ...baseExecution, completed: true }

    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={completedExecution}
        onChange={onChange}
      />
    )

    expect(screen.getByLabelText('Exercício concluído')).toBeInTheDocument()
  })

  it('does not show the "Concluído" badge when completed is false', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={baseExecution}
        onChange={onChange}
      />
    )

    expect(screen.queryByLabelText('Exercício concluído')).not.toBeInTheDocument()
  })

  // ── Requirement 6.9: validation errors displayed inline ──────────────────

  it('shows setsCompleted error message when provided', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
        errors={{ setsCompleted: 'As séries realizadas devem ser um número inteiro entre 0 e 20.' }}
      />
    )

    expect(
      screen.getByText('As séries realizadas devem ser um número inteiro entre 0 e 20.')
    ).toBeInTheDocument()
  })

  it('shows repsCompleted error message when provided', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
        errors={{ repsCompleted: 'As repetições realizadas devem ser um número inteiro entre 0 e 100.' }}
      />
    )

    expect(
      screen.getByText('As repetições realizadas devem ser um número inteiro entre 0 e 100.')
    ).toBeInTheDocument()
  })

  it('shows completed error message when provided', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
        errors={{ completed: 'O campo "concluído" é obrigatório.' }}
      />
    )

    expect(screen.getByText('O campo "concluído" é obrigatório.')).toBeInTheDocument()
  })

  it('does not show error messages when errors prop is empty', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
        errors={{}}
      />
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('marks setsCompleted input as aria-invalid when error is present', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
        errors={{ setsCompleted: 'Erro nas séries.' }}
      />
    )

    const input = screen.getByLabelText(/séries realizadas/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('marks repsCompleted input as aria-invalid when error is present', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
        errors={{ repsCompleted: 'Erro nas repetições.' }}
      />
    )

    const input = screen.getByLabelText(/reps realizadas/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  // ── onChange callbacks ────────────────────────────────────────────────────

  it('calls onChange with completed: true when "Sim" button is clicked', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={baseExecution}
        onChange={onChange}
      />
    )

    const simButton = screen.getByRole('button', { name: /sim/i })
    fireEvent.click(simButton)

    expect(onChange).toHaveBeenCalledWith({ completed: true })
  })

  it('calls onChange with completed: false when "Não" button is clicked', () => {
    const completedExecution: ExerciseExecution = { ...baseExecution, completed: true }

    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={completedExecution}
        onChange={onChange}
      />
    )

    const naoButton = screen.getByRole('button', { name: /não/i })
    fireEvent.click(naoButton)

    expect(onChange).toHaveBeenCalledWith({ completed: false })
  })

  it('calls onChange with setsCompleted when sets input changes', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={baseExecution}
        onChange={onChange}
      />
    )

    const setsInput = screen.getByLabelText(/séries realizadas/i)
    fireEvent.change(setsInput, { target: { value: '4' } })

    expect(onChange).toHaveBeenCalledWith({ setsCompleted: 4 })
  })

  it('calls onChange with repsCompleted when reps input changes', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={baseExecution}
        onChange={onChange}
      />
    )

    const repsInput = screen.getByLabelText(/reps realizadas/i)
    fireEvent.change(repsInput, { target: { value: '12' } })

    expect(onChange).toHaveBeenCalledWith({ repsCompleted: 12 })
  })

  // ── Pre-fill from execution prop ──────────────────────────────────────────

  it('pre-fills setsCompleted from execution prop', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={baseExecution}
        onChange={onChange}
      />
    )

    const setsInput = screen.getByLabelText(/séries realizadas/i) as HTMLInputElement
    expect(setsInput.value).toBe('3')
  })

  it('pre-fills repsCompleted from execution prop', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={baseExecution}
        onChange={onChange}
      />
    )

    const repsInput = screen.getByLabelText(/reps realizadas/i) as HTMLInputElement
    expect(repsInput.value).toBe('10')
  })

  it('pre-fills notes from execution prop', () => {
    const executionWithNotes: ExerciseExecution = {
      ...baseExecution,
      notes: 'Senti dor no ombro',
    }

    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        execution={executionWithNotes}
        onChange={onChange}
      />
    )

    expect(screen.getByDisplayValue('Senti dor no ombro')).toBeInTheDocument()
  })

  // ── No execution provided ─────────────────────────────────────────────────

  it('renders without execution prop (empty state)', () => {
    render(
      <ExerciseExecutionCard
        exercise={baseExercise}
        onChange={onChange}
      />
    )

    expect(screen.getByText('Supino reto')).toBeInTheDocument()
    const card = screen.getByTestId('exercise-execution-card')
    expect(card).toHaveAttribute('data-completed', 'false')
  })
})
