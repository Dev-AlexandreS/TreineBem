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
import DailyLogForm from '../DailyLogForm'
import type { DailyLog, ValidationResult } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validResult(): ValidationResult {
  return { valid: true, errors: {} }
}

function invalidResult(errors: Record<string, string>): ValidationResult {
  return { valid: false, errors }
}

/** Returns today's date as YYYY-MM-DD (same logic as the component). */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DailyLogForm', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Requirement 4.2: date pre-selected to today ───────────────────────────

  it('pre-selects today\'s date when no date prop is provided', () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(validResult())

    render(<DailyLogForm onSave={onSave} />)

    const dateInput = screen.getByLabelText(/data/i) as HTMLInputElement
    expect(dateInput.value).toBe(getTodayDate())
  })

  it('pre-selects the provided date prop instead of today', () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(validResult())

    render(<DailyLogForm date="2024-01-15" onSave={onSave} />)

    const dateInput = screen.getByLabelText(/data/i) as HTMLInputElement
    expect(dateInput.value).toBe('2024-01-15')
  })

  it('pre-fills all fields in edit mode when a log is provided', () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(validResult())

    const existingLog: DailyLog = {
      date: '2024-03-10',
      weight: 75.5,
      waterLiters: 2.5,
      trained: true,
      followedPlan: false,
      didSomethingDifferent: false,
      notes: 'Dia cansativo',
    }

    render(<DailyLogForm log={existingLog} onSave={onSave} />)

    expect((screen.getByLabelText(/data/i) as HTMLInputElement).value).toBe('2024-03-10')
    expect((screen.getByLabelText(/peso do dia/i) as HTMLInputElement).value).toBe('75.5')
    expect((screen.getByLabelText(/água consumida/i) as HTMLInputElement).value).toBe('2.5')
    expect(screen.getByDisplayValue('Dia cansativo')).toBeInTheDocument()
  })

  // ── Requirement 4.8: conditional description field ────────────────────────

  it('does not show the description field when "Fez algo diferente" is not selected', () => {
    render(<DailyLogForm onSave={onSave} />)

    expect(screen.queryByLabelText(/descreva o que foi diferente/i)).not.toBeInTheDocument()
  })

  it('shows the description field when "Fez algo diferente" is set to Sim', async () => {
    render(<DailyLogForm onSave={onSave} />)

    // Click the "Sim" button for "Fez algo diferente"
    const simButtons = screen.getAllByRole('button', { name: /sim/i })
    // The "Fez algo diferente" toggle is the third boolean toggle (trained, followedPlan, didSomethingDifferent)
    fireEvent.click(simButtons[2])

    await waitFor(() => {
      expect(screen.getByLabelText(/descreva o que foi diferente/i)).toBeInTheDocument()
    })
  })

  it('hides the description field when "Fez algo diferente" is switched back to Não', async () => {
    render(<DailyLogForm onSave={onSave} />)

    const simButtons = screen.getAllByRole('button', { name: /sim/i })
    fireEvent.click(simButtons[2]) // set to Sim

    await waitFor(() => {
      expect(screen.getByLabelText(/descreva o que foi diferente/i)).toBeInTheDocument()
    })

    const naoButtons = screen.getAllByRole('button', { name: /não/i })
    fireEvent.click(naoButtons[2]) // set back to Não

    await waitFor(() => {
      expect(screen.queryByLabelText(/descreva o que foi diferente/i)).not.toBeInTheDocument()
    })
  })

  it('shows description field pre-filled in edit mode when didSomethingDifferent is true', () => {
    const existingLog: DailyLog = {
      date: '2024-03-10',
      trained: true,
      followedPlan: true,
      didSomethingDifferent: true,
      differentDescription: 'Fiz yoga no lugar do treino',
    }

    render(<DailyLogForm log={existingLog} onSave={onSave} />)

    expect(screen.getByLabelText(/descreva o que foi diferente/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fiz yoga no lugar do treino')).toBeInTheDocument()
  })

  // ── Validation errors ─────────────────────────────────────────────────────

  it('shows inline error for date field when validator returns date error', async () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(
      invalidResult({ date: 'A data é obrigatória.' })
    )

    render(<DailyLogForm onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }))

    await waitFor(() => {
      expect(screen.getByText('A data é obrigatória.')).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows inline error for weight field when validator returns weight error', async () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(
      invalidResult({ weight: 'O peso deve ser um número decimal entre 30,0 e 300,0 kg.' })
    )

    render(<DailyLogForm onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }))

    await waitFor(() => {
      expect(
        screen.getByText('O peso deve ser um número decimal entre 30,0 e 300,0 kg.')
      ).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows inline error for waterLiters field when validator returns waterLiters error', async () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(
      invalidResult({
        waterLiters: 'O consumo de água deve ser um número decimal entre 0,0 e 10,0 litros.',
      })
    )

    render(<DailyLogForm onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }))

    await waitFor(() => {
      expect(
        screen.getByText(
          'O consumo de água deve ser um número decimal entre 0,0 e 10,0 litros.'
        )
      ).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows inline error for trained field when validator returns trained error', async () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(
      invalidResult({ trained: 'O campo "Treinou hoje" é obrigatório.' })
    )

    render(<DailyLogForm onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }))

    await waitFor(() => {
      expect(screen.getByText('O campo "Treinou hoje" é obrigatório.')).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('does not close the form when validation fails', async () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(
      invalidResult({ trained: 'O campo "Treinou hoje" é obrigatório.' })
    )

    render(<DailyLogForm onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }))

    await waitFor(() => {
      expect(screen.getByText('O campo "Treinou hoje" é obrigatório.')).toBeInTheDocument()
    })

    // Form is still rendered
    expect(screen.getByRole('button', { name: /salvar registro/i })).toBeInTheDocument()
  })

  // ── Valid submission ───────────────────────────────────────────────────────

  it('calls onSave with correct data when validator returns valid', async () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(validResult())

    const user = userEvent.setup()
    render(<DailyLogForm onSave={onSave} />)

    // Fill weight and water
    await user.type(screen.getByLabelText(/peso do dia/i), '75.5')
    await user.type(screen.getByLabelText(/água consumida/i), '2.5')

    // Toggle boolean fields
    const simButtons = screen.getAllByRole('button', { name: /sim/i })
    fireEvent.click(simButtons[0]) // trained = true
    fireEvent.click(simButtons[1]) // followedPlan = true
    fireEvent.click(simButtons[2]) // didSomethingDifferent = true

    await user.click(screen.getByRole('button', { name: /salvar registro/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce()
    })

    const saved = onSave.mock.calls[0][0] as DailyLog
    expect(saved.weight).toBe(75.5)
    expect(saved.waterLiters).toBe(2.5)
    expect(saved.trained).toBe(true)
    expect(saved.followedPlan).toBe(true)
    expect(saved.didSomethingDifferent).toBe(true)
  })

  it('calls onSave without optional fields when they are empty', async () => {
    vi.mocked(validator.validateDailyLog).mockReturnValue(validResult())

    render(<DailyLogForm onSave={onSave} />)

    // Toggle required boolean fields only
    const naoButtons = screen.getAllByRole('button', { name: /não/i })
    fireEvent.click(naoButtons[0]) // trained = false
    fireEvent.click(naoButtons[1]) // followedPlan = false
    fireEvent.click(naoButtons[2]) // didSomethingDifferent = false

    fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce()
    })

    const saved = onSave.mock.calls[0][0] as DailyLog
    expect(saved.weight).toBeUndefined()
    expect(saved.waterLiters).toBeUndefined()
    expect(saved.notes).toBeUndefined()
  })

  // ── Edit mode ─────────────────────────────────────────────────────────────

  it('shows "Salvar alterações" button in edit mode', () => {
    const existingLog: DailyLog = {
      date: '2024-03-10',
      trained: true,
      followedPlan: true,
      didSomethingDifferent: false,
    }

    render(<DailyLogForm log={existingLog} onSave={onSave} />)

    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument()
  })

  // ── Cancel ────────────────────────────────────────────────────────────────

  it('calls onCancel when cancel button is clicked', () => {
    render(<DailyLogForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('does not render cancel button when onCancel is not provided', () => {
    render(<DailyLogForm onSave={onSave} />)

    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })
})
