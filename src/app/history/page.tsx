'use client'

import { useState, useEffect, useCallback } from 'react'
import { storageService } from '@/lib/storage/storage.service'
import type { DailyLog, ExerciseExecution, ISODateString } from '@/types'

// ─── Period filter types ──────────────────────────────────────────────────────

type PeriodFilter = 'week' | 'month' | 'all'

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  week: 'Semana atual',
  month: 'Mês atual',
  all: 'Todos',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISO(date: Date): ISODateString {
  return date.toISOString().split('T')[0]
}

/**
 * Returns the Monday of the current week (ISO week: Mon–Sun).
 */
function getWeekStart(): Date {
  const today = new Date()
  const day = today.getDay() // 0 = Sun, 1 = Mon, …
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Returns the Sunday of the current week.
 */
function getWeekEnd(): Date {
  const monday = getWeekStart()
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

/**
 * Returns the first day of the current month.
 */
function getMonthStart(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}

/**
 * Returns the last day of the current month.
 */
function getMonthEnd(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth() + 1, 0)
}

/**
 * Formats an ISO date string for display (e.g. "seg, 12 jan 2025").
 */
function formatDate(iso: ISODateString): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LogListItemProps {
  log: DailyLog
  isSelected: boolean
  onClick: () => void
}

function LogListItem({ log, isSelected, onClick }: LogListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={[
        'w-full text-left rounded-xl border px-4 py-3 transition-colors',
        isSelected
          ? 'bg-blue-900/40 border-blue-600'
          : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Date */}
        <span className="text-sm font-medium text-white capitalize">
          {formatDate(log.date)}
        </span>

        {/* Trained indicator */}
        <span
          aria-label={log.trained ? 'Treinou' : 'Não treinou'}
          className={[
            'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            log.trained
              ? 'bg-green-900/60 text-green-400'
              : 'bg-gray-700 text-gray-400',
          ].join(' ')}
        >
          {log.trained ? '✓ Treinou' : '— Descanso'}
        </span>
      </div>

      {/* Metrics row */}
      {(log.weight !== undefined || log.waterLiters !== undefined) && (
        <div className="mt-1.5 flex gap-3 text-xs text-gray-400">
          {log.weight !== undefined && (
            <span>⚖ {log.weight.toFixed(1)} kg</span>
          )}
          {log.waterLiters !== undefined && (
            <span>💧 {log.waterLiters.toFixed(1)} L</span>
          )}
        </div>
      )}
    </button>
  )
}

interface ExecutionListProps {
  executions: ExerciseExecution[]
}

function ExecutionList({ executions }: ExecutionListProps) {
  if (executions.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">
        Exercícios executados
      </h3>
      <ul className="space-y-2" aria-label="Exercícios executados">
        {executions.map((ex) => (
          <li
            key={ex.id}
            className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white truncate">
                {ex.exerciseName}
              </span>
              <span
                className={[
                  'shrink-0 text-xs font-semibold',
                  ex.completed ? 'text-green-400' : 'text-gray-500',
                ].join(' ')}
              >
                {ex.completed ? '✓ Concluído' : 'Incompleto'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {ex.setsCompleted} séries × {ex.repsCompleted} reps
              {ex.weightUsed !== undefined && ` · ${ex.weightUsed} kg`}
            </p>
            {ex.notes && (
              <p className="text-xs text-gray-500 mt-0.5 italic">{ex.notes}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface LogDetailProps {
  log: DailyLog
  executions: ExerciseExecution[]
}

function LogDetail({ log, executions }: LogDetailProps) {
  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
      {/* Header */}
      <h2 className="text-base font-semibold text-white capitalize">
        {formatDate(log.date)}
      </h2>

      {/* Metrics */}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        {log.weight !== undefined && (
          <>
            <dt className="text-gray-400">Peso</dt>
            <dd className="text-white font-medium">{log.weight.toFixed(1)} kg</dd>
          </>
        )}
        {log.waterLiters !== undefined && (
          <>
            <dt className="text-gray-400">Água</dt>
            <dd className="text-white font-medium">{log.waterLiters.toFixed(1)} L</dd>
          </>
        )}
        <dt className="text-gray-400">Treinou</dt>
        <dd className={log.trained ? 'text-green-400 font-medium' : 'text-gray-400'}>
          {log.trained ? 'Sim' : 'Não'}
        </dd>
        <dt className="text-gray-400">Seguiu o plano</dt>
        <dd className={log.followedPlan ? 'text-green-400 font-medium' : 'text-gray-400'}>
          {log.followedPlan ? 'Sim' : 'Não'}
        </dd>
        {log.didSomethingDifferent && (
          <>
            <dt className="text-gray-400">Algo diferente</dt>
            <dd className="text-yellow-400 font-medium">Sim</dd>
          </>
        )}
      </dl>

      {/* Different description */}
      {log.didSomethingDifferent && log.differentDescription && (
        <div className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2">
          <p className="text-xs text-gray-400 mb-0.5">Descrição</p>
          <p className="text-sm text-white">{log.differentDescription}</p>
        </div>
      )}

      {/* Notes */}
      {log.notes && (
        <div className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2">
          <p className="text-xs text-gray-400 mb-0.5">Observações</p>
          <p className="text-sm text-white">{log.notes}</p>
        </div>
      )}

      {/* Exercise executions */}
      <ExecutionList executions={executions} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * History page — lists DailyLogs in descending chronological order with
 * period filters (current week, current month, all). Selecting a log shows
 * its details including associated ExerciseExecutions.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
export default function HistoryPage() {
  const [filter, setFilter] = useState<PeriodFilter>('week')
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [executions, setExecutions] = useState<ExerciseExecution[]>([])

  // ── Load logs for the selected period ────────────────────────────────────

  const loadLogs = useCallback((period: PeriodFilter) => {
    let from: ISODateString
    let to: ISODateString

    if (period === 'week') {
      from = toISO(getWeekStart())
      to = toISO(getWeekEnd())
    } else if (period === 'month') {
      from = toISO(getMonthStart())
      to = toISO(getMonthEnd())
    } else {
      // 'all' — use a wide range that covers any realistic data
      from = '2000-01-01'
      to = '2099-12-31'
    }

    const fetched = storageService.getDailyLogs(from, to)

    // Sort descending (most recent first) — Requirement 7.2
    const sorted = [...fetched].sort((a, b) => (a.date < b.date ? 1 : -1))
    setLogs(sorted)
    setSelectedLog(null)
    setExecutions([])
  }, [])

  useEffect(() => {
    loadLogs(filter)
  }, [filter, loadLogs])

  // ── Load executions when a log is selected ────────────────────────────────

  function handleSelectLog(log: DailyLog) {
    if (selectedLog?.date === log.date) {
      // Toggle off
      setSelectedLog(null)
      setExecutions([])
      return
    }
    setSelectedLog(log)
    const execs = storageService.getExerciseExecutions(log.date)
    setExecutions(execs)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Histórico</h1>

      {/* Period filter — Requirement 7.3 */}
      <section aria-label="Filtro de período">
        <div
          role="group"
          aria-label="Filtrar por período"
          className="flex gap-2 flex-wrap"
        >
          {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={filter === period}
              onClick={() => setFilter(period)}
              className={[
                'min-h-[44px] px-4 rounded-lg text-sm font-medium transition-colors',
                filter === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-100',
              ].join(' ')}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
        </div>
      </section>

      {/* Log list — Requirements 7.2, 7.4, 7.7 */}
      <section aria-label="Lista de registros diários">
        {logs.length === 0 ? (
          // Requirement 7.8 — no data message
          <div className="rounded-2xl bg-gray-800 border border-gray-700 p-6 text-center">
            <p className="text-gray-400 text-sm">
              Nenhum registro encontrado para o período selecionado.
            </p>
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Registros diários">
            {logs.map((log) => (
              <li key={log.date}>
                <LogListItem
                  log={log}
                  isSelected={selectedLog?.date === log.date}
                  onClick={() => handleSelectLog(log)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Log detail — Requirements 7.5, 7.6 */}
      {selectedLog !== null && (
        <section aria-label="Detalhes do registro">
          <LogDetail log={selectedLog} executions={executions} />
        </section>
      )}
    </div>
  )
}
