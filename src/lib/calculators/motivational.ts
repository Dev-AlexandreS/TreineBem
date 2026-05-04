import type { ISODateString } from '@/types'

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Lista de mensagens motivacionais em português.
 * Mínimo de 30 mensagens para garantir variedade ao longo do mês.
 *
 * Requirements: 11.1
 */
export const MOTIVATIONAL_MESSAGES: string[] = [
  'Cada treino é um passo a mais em direção à sua melhor versão.',
  'A consistência supera a intensidade. Continue aparecendo.',
  'Seu corpo pode aguentar muito mais do que sua mente imagina.',
  'Progresso, não perfeição. Cada dia conta.',
  'O único treino ruim é aquele que não aconteceu.',
  'Você não precisa ser perfeito, só precisa ser consistente.',
  'Dor de hoje, força de amanhã.',
  'Cada gota de suor é um investimento no seu futuro.',
  'Não compare seu capítulo 1 com o capítulo 20 de outra pessoa.',
  'A disciplina é a ponte entre metas e conquistas.',
  'Você já fez a parte mais difícil: começou.',
  'Pequenos progressos diários levam a grandes resultados.',
  'Seu esforço de hoje é o seu resultado de amanhã.',
  'Acredite no processo. Os resultados virão.',
  'Força não vem do que você consegue fazer. Vem de superar o que você achava impossível.',
  'Cada repetição te aproxima do seu objetivo.',
  'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
  'Não desista. O começo é sempre o mais difícil.',
  'Você é mais forte do que pensa.',
  'Transformação leva tempo. Confie na jornada.',
  'Cuide do seu corpo. É o único lugar onde você tem que viver.',
  'Motivação te faz começar. Hábito te faz continuar.',
  'Cada dia é uma nova oportunidade de ser melhor.',
  'O segredo é começar. O resto vem com o tempo.',
  'Seu futuro eu vai agradecer pelo esforço de hoje.',
  'Não existe atalho para nenhum lugar que valha a pena ir.',
  'Foco, fé e força. Você consegue.',
  'A jornada de mil quilômetros começa com um único passo.',
  'Seja mais forte que suas desculpas.',
  'Resultados acontecem fora da zona de conforto.',
  'Cada treino é uma vitória sobre a preguiça.',
  'Invista em você. É o melhor investimento que existe.',
]

// ─── Function ─────────────────────────────────────────────────────────────────

/**
 * Retorna o dia do ano (1–366) para uma data ISO.
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

/**
 * Seleciona uma mensagem motivacional de forma determinística baseada na data.
 * A mesma data sempre retorna a mesma mensagem.
 *
 * Fórmula: index = (year * 366 + dayOfYear) % MOTIVATIONAL_MESSAGES.length
 *
 * Requirements: 11.2, 11.3
 */
export function getMotivationalMessage(date: ISODateString): string {
  const d = new Date(date + 'T00:00:00')
  const year = d.getFullYear()
  const dayOfYear = getDayOfYear(d)
  const index = (year * 366 + dayOfYear) % MOTIVATIONAL_MESSAGES.length
  return MOTIVATIONAL_MESSAGES[index]
}
