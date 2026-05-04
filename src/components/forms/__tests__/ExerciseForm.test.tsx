import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ─── Mock the validator ───────────────────────────────────────────────────────

vi.mock('@/lib/validators', () => ({
  validator: {
    validateExercise: vi.fn(),
    validateDailyLog: vi.fn(),
    validateGoals: vi.fn(),
    validateExerciseExecution: vi.fn(),
  },
}))

// ─── Import after mocks ───────────────────────────────────────────────────────

import { validator } from '@/lib/validators'
import ExerciseForm from '../ExerciseForm'
import type { Exercise, ValidationResult } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validResult(): ValidationResult {
  return { valid: true, errors: {} }
}

function invalidResult(errors: Record<string, string>): ValidationResult {
  return { valid: false, errors }
}

const validExercise: Exercise = {
  id: 'ex-1',
  name: 'Supino reto',
  muscleGroup: 'chest',
  plannedSets: 3,
  plannedReps: '10–12',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExerciseForm', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Requirement 3.1: name field is required ───────────────────────────────

  it('shows inline error for name field when validator returns name error', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(
      invalidResult({ name: 'O nome do exercício é obrigatório.' })
    )

    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(screen.getByText('O nome do exercício é obrigatório.')).toBeInTheDocument()
    })

    // Form should NOT have been submitted
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows inline error for muscleGroup field when validator returns muscleGroup error', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(
      invalidResult({ muscleGroup: 'O grupo muscular é obrigatório.' })
    )

    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(screen.getByText('O grupo muscular é obrigatório.')).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows inline error for plannedSets field when validator returns plannedSets error', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(
      invalidResult({ plannedSets: 'O número de séries previstas é obrigatório.' })
    )

    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(screen.getByText('O número de séries previstas é obrigatório.')).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows inline error for plannedReps field when validator returns plannedReps error', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(
      invalidResult({ plannedReps: 'O número de repetições previstas é obrigatório.' })
    )

    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(screen.getByText('O número de repetições previstas é obrigatório.')).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows multiple inline errors simultaneously without closing the form', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(
      invalidResult({
        name: 'O nome do exercício é obrigatório.',
        muscleGroup: 'O grupo muscular é obrigatório.',
        plannedSets: 'O número de séries previstas é obrigatório.',
        plannedReps: 'O número de repetições previstas é obrigatório.',
      })
    )

    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(screen.getByText('O nome do exercício é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('O grupo muscular é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('O número de séries previstas é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('O número de repetições previstas é obrigatório.')).toBeInTheDocument()
    })

    // Form is still rendered (not closed)
    expect(screen.getByRole('button', { name: /adicionar exercício/i })).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  // ── Requirement 3.9: valid submission calls onSave ────────────────────────

  it('calls onSave with correct data when validator returns valid', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(validResult())

    const user = userEvent.setup()
    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    await user.type(screen.getByLabelText(/nome/i), 'Supino reto')
    await user.selectOptions(screen.getByLabelText(/grupo muscular/i), 'chest')
    await user.type(screen.getByLabelText(/séries previstas/i), '3')
    await user.type(screen.getByLabelText(/repetições previstas/i), '10–12')

    await user.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce()
    })

    const saved = onSave.mock.calls[0][0] as Exercise
    expect(saved.name).toBe('Supino reto')
    expect(saved.muscleGroup).toBe('chest')
    expect(saved.plannedSets).toBe(3)
    expect(saved.plannedReps).toBe('10–12')
    expect(typeof saved.id).toBe('string')
  })

  it('calls onSave with optional fields when provided', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(validResult())

    const user = userEvent.setup()
    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    await user.type(screen.getByLabelText(/nome/i), 'Agachamento')
    await user.selectOptions(screen.getByLabelText(/grupo muscular/i), 'legs')
    await user.type(screen.getByLabelText(/séries previstas/i), '4')
    await user.type(screen.getByLabelText(/repetições previstas/i), '12')
    await user.type(screen.getByLabelText(/carga/i), '80')
    await user.type(screen.getByLabelText(/descanso/i), '90')
    await user.type(screen.getByLabelText(/observações/i), 'Manter costas retas')

    await user.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce()
    })

    const saved = onSave.mock.calls[0][0] as Exercise
    expect(saved.plannedWeight).toBe(80)
    expect(saved.restSeconds).toBe(90)
    expect(saved.notes).toBe('Manter costas retas')
  })

  // ── Edit mode ─────────────────────────────────────────────────────────────

  it('pre-fills fields in edit mode', () => {
    vi.mocked(validator.validateExercise).mockReturnValue(validResult())

    render(<ExerciseForm exercise={validExercise} onSave={onSave} onCancel={onCancel} />)

    expect(screen.getByDisplayValue('Supino reto')).toBeInTheDocument()
    // The select shows the option label ("Peito") as its display value, not the raw value ("chest")
    expect(screen.getByDisplayValue('Peito')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10–12')).toBeInTheDocument()
  })

  it('shows "Salvar alterações" button in edit mode', () => {
    render(<ExerciseForm exercise={validExercise} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument()
  })

  it('preserves the exercise id when saving in edit mode', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(validResult())

    const user = userEvent.setup()
    render(<ExerciseForm exercise={validExercise} onSave={onSave} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce()
    })

    const saved = onSave.mock.calls[0][0] as Exercise
    expect(saved.id).toBe('ex-1')
  })

  // ── Cancel ────────────────────────────────────────────────────────────────

  it('calls onCancel when cancel button is clicked', async () => {
    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
  })

  // ── Error clearing ────────────────────────────────────────────────────────

  it('clears a field error when the user starts typing in that field', async () => {
    vi.mocked(validator.validateExercise).mockReturnValue(
      invalidResult({ name: 'O nome do exercício é obrigatório.' })
    )

    const user = userEvent.setup()
    render(<ExerciseForm onSave={onSave} onCancel={onCancel} />)

    // Trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: /adicionar exercício/i }))

    await waitFor(() => {
      expect(screen.getByText('O nome do exercício é obrigatório.')).toBeInTheDocument()
    })

    // Start typing in the name field — error should disappear
    await user.type(screen.getByLabelText(/nome/i), 'S')

    expect(screen.queryByText('O nome do exercício é obrigatório.')).not.toBeInTheDocument()
  })
})
