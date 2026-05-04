'use client'

import Link from 'next/link'
import { BMI_CLASSIFICATION_LABELS } from '@/lib/calculators/bmi.calculator'
import type { BMIClassification } from '@/lib/calculators/bmi.calculator'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BMICardProps {
  bmi: number | null
  classification: BMIClassification | null
  /** Se null, exibe mensagem para cadastrar altura */
  heightCm: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClassificationColor(classification: BMIClassification): string {
  switch (classification) {
    case 'underweight':
      return 'text-blue-400'
    case 'normal':
      return 'text-green-400'
    case 'overweight':
      return 'text-yellow-400'
    case 'obesity_1':
    case 'obesity_2':
    case 'obesity_3':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Cartão de IMC com classificação OMS.
 * Exibe mensagem para cadastrar altura quando heightCm é null.
 *
 * Requirements: 9.4, 13.3, 13.4
 */
export default function BMICard({ bmi, classification, heightCm }: BMICardProps) {
  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-2">
      <h3 className="text-base font-semibold text-white">IMC</h3>

      {heightCm === null ? (
        // Sem altura cadastrada (Req 13.4)
        <p className="text-sm text-gray-400">
          Cadastre sua altura nas{' '}
          <Link
            href="/settings"
            className="text-blue-400 underline hover:text-blue-300 transition-colors"
          >
            Configurações
          </Link>{' '}
          para calcular o IMC.
        </p>
      ) : bmi !== null && classification !== null ? (
        // IMC calculado (Req 13.3)
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-white">{bmi.toFixed(2)}</p>
            <p className={`text-sm font-medium mt-0.5 ${getClassificationColor(classification)}`}>
              {BMI_CLASSIFICATION_LABELS[classification]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Altura</p>
            <p className="text-sm font-medium text-gray-300">{heightCm} cm</p>
          </div>
        </div>
      ) : (
        // Altura cadastrada mas sem peso
        <p className="text-sm text-gray-400">
          Registre seu peso no check-in diário para calcular o IMC.
        </p>
      )}
    </div>
  )
}
