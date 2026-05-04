'use client'

import { useState, useEffect, useCallback } from 'react'
import { storageService } from '@/lib/storage/storage.service'
import EmptyState from '@/components/ui/EmptyState'
import type { DailyLog, ExerciseExecution, ISODateString } from '@/types'

// ─── Period filter ────────────────────────────────────────────────────────────

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

function getWeekStart(): Date {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekEnd(): Date {
  const monday = getWeekStart()
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday
}

function getMonthStart(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}

function getMonthEnd(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth() + 1, 0)
}

/**
 * Formata data ISO para exibição: "seg, 12 jan 2025"
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

// ─── Log List Item ────────────────────────────────────────────────────────────

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
        'w-full text-left rounded-2xl border px-4 py-3 transition-colors',
        isSelected
          ? 'bg-blue-900/40 border-blue-600'
          : log.followedPlan
          ? 'bg-gray-800 border-blue-700/50 hover:border-blue-600'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Date */}
        <span className="text-sm font-medium text-white capitalize">
          {formatDate(log.date)}
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seguiu o plano badge (Req 8.5) */}
          {log.followedPlan && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-900/60 text-blue-400 border border-blue-700/50">
              📋 Seguiu o plano
            </span>
          )}
          {/* Treinou badge (Req 8.4) */}
          <span
            className={[
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              log.trained
                ? 'bg-green-900/60 text-green-400'
                : 'bg-gray-700 text-gray-400',
            ].join(' ')}
          >
            {log.trained ? '✓ Treinou' : '— Descanso'}
          </span>
        </div>
      </div>

      {/* Métricas (Req 8.4) */}
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

// ─── Execution List ───────────────────────────────────────────────────────────

function ExecutionList({ executions }: { executions: ExerciseExecution[] }) {
  if (executions.length === 0) return null

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-300">Exercícios executados</h3>
      <ul className="space-y-2" aria-label="Exercícios executados">
        {executions.map((ex) => (
          <li
            key={ex.id}
            className="rounded-xl bg-gray-700/50 border border-gray-700 px-3 py-2.5"
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
                {ex.completed ? '✓' : '○'}
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

// ─── Log Detail ───────────────────────────────────────────────────────────────

function LogDetail({ log, executions }: { log: DailyLog; executions: ExerciseExecution[] }) {
  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
      <h2 className="text-base font-semibold text-white capitalize">
        {formatDate(log.date)}
      </h2>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
        <dd className={log.followedPlan ? 'text-blue-400 font-medium' : 'text-gray-400'}>
          {log.followedPlan ? 'Sim' : 'Não'}
        </dd>
        {log.didSomethingDifferent && (
          <>
            <dt className="text-gray-400">Algo diferente</dt>
            <dd className="text-yellow-400 font-medium">Sim</dd>
          </>
        )}
      </dl>

      {log.didSomethingDifferent && log.differentDescription && (
        <div className="rounded-lg bg-gray-700/50 border border-gray-700 px-3 py-2">
          <p className="text-xs text-gray-400 mb-0.5">Descrição</p>
          <p className="text-sm text-white">{log.differentDescription}</p>
        </div>
      )}

      {log.notes && (
        <div className="rounded-lg bg-gray-700/50 border border-gray-700 px-3 py-2">
          <p className="text-xs text-gray-400 mb-0.5">Observações</p>
          <p className="text-sm text-white">{log.notes}</p>
        </div>
      )}

      <ExecutionList executions={executions} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Histórico de registros diários com filtros de período e detalhes completos.
 *
 * Requirements: 8.1–8.8
 */
export default function HistoryPage() {
  const [filter, setFilter] = useState<PeriodFilter>('week')
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [executions, setExecutions] = useState<ExerciseExecution[]>([])

  // ── Load logs ─────────────────────────────────────────────────────────────

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
      from = '2000-01-01'
      to = '2099-12-31'
    }

    const fetched = storageService.getDailyLogs(from, to)
    // Ordem decrescente (Req 8.1)
    const sorted = [...fetched].sort((a, b) => (a.date < b.date ? 1 : -1))
    setLogs(sorted)
    setSelectedLog(null)
    setExecutions([])
  }, [])

  useEffect(() => {
    loadLogs(filter)
  }, [filter, loadLogs])

  // ── Select log ────────────────────────────────────────────────────────────

  function handleSelectLog(log: DailyLog) {
    if (selectedLog?.date === log.date) {
      setSelectedLog(null)
      setExecutions([])
      return
    }
    setSelectedLog(log)
    setExecutions(storageService.getExerciseExecutions(log.date))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5 pb-24">
      <h1 className="text-2xl font-bold text-white">Histórico</h1>

      {/* Filtros de período (Req 8.2–8.3) */}
      <section aria-label="Filtro de período">
        <div role="group" aria-label="Filtrar por período" className="flex gap-2 flex-wrap">
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

      {/* Lista de registros */}
      <section aria-label="Lista de registros diários">
        {logs.length === 0 ? (
          // Estado vazio (Req 8.8)
          <EmptyState
            icon="📋"
            message="Nenhum registro encontrado para o período selecionado."
          />
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

      {/* Detalhes do registro (Req 8.6–8.7) */}
      {selectedLog !== null && (
        <section aria-label="Detalhes do registro">
          <LogDetail log={selectedLog} executions={executions} />
        </section>
      )}
    </div>
  )
}
