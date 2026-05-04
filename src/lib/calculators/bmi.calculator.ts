// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Classificação de IMC conforme tabela da OMS.
 */
export type BMIClassification =
  | 'underweight'  // < 18.5
  | 'normal'       // 18.5–24.9
  | 'overweight'   // 25–29.9
  | 'obesity_1'    // 30–34.9
  | 'obesity_2'    // 35–39.9
  | 'obesity_3'    // >= 40

export interface BMIResult {
  /** Valor do IMC com 2 casas decimais */
  value: number
  /** Classificação OMS */
  classification: BMIClassification
}

// ─── Labels em português ──────────────────────────────────────────────────────

export const BMI_CLASSIFICATION_LABELS: Record<BMIClassification, string> = {
  underweight: 'Abaixo do peso',
  normal: 'Normal',
  overweight: 'Sobrepeso',
  obesity_1: 'Obesidade grau I',
  obesity_2: 'Obesidade grau II',
  obesity_3: 'Obesidade grau III',
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Classifica um valor de IMC conforme os limiares da OMS.
 *
 * Requirements: 13.3
 */
export function classifyBMI(bmi: number): BMIClassification {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  if (bmi < 35) return 'obesity_1'
  if (bmi < 40) return 'obesity_2'
  return 'obesity_3'
}

/**
 * Calcula o IMC a partir do peso (kg) e altura (cm).
 * Fórmula: peso (kg) / (altura (m))²
 * Resultado arredondado para 2 casas decimais.
 *
 * Requirements: 13.2, 13.3
 */
export function calculateBMI(weightKg: number, heightCm: number): BMIResult {
  const heightM = heightCm / 100
  const raw = weightKg / (heightM * heightM)
  const value = Math.round(raw * 100) / 100
  const classification = classifyBMI(value)
  return { value, classification }
}
