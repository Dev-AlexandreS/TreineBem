// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldValidationResult {
  valid: boolean
  error?: string
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Valida a altura em cm.
 * Intervalo válido: [100, 250] cm (inteiro).
 *
 * Requirements: 14.4
 */
export function validateHeight(value: number): FieldValidationResult {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'A altura deve ser um número válido.' }
  }
  if (value < 100 || value > 250) {
    return {
      valid: false,
      error: 'A altura deve ser um número inteiro entre 100 e 250 cm.',
    }
  }
  return { valid: true }
}

/**
 * Valida o peso do check-in diário em kg.
 * Intervalo válido: [30, 300] kg.
 *
 * Requirements: 10.6
 */
export function validateCheckinWeight(value: number): FieldValidationResult {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'O peso deve ser um número válido.' }
  }
  if (value < 30 || value > 300) {
    return {
      valid: false,
      error: 'O peso deve ser um número entre 30 e 300 kg.',
    }
  }
  return { valid: true }
}

/**
 * Valida o consumo de água do check-in diário em litros.
 * Intervalo válido: [0, 10] L.
 *
 * Requirements: 10.7
 */
export function validateCheckinWater(value: number): FieldValidationResult {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'O consumo de água deve ser um número válido.' }
  }
  if (value < 0 || value > 10) {
    return {
      valid: false,
      error: 'O consumo de água deve ser um número entre 0 e 10 litros.',
    }
  }
  return { valid: true }
}
