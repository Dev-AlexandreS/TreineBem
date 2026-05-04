import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyLog } from '@/types'
import WeightChart from '../WeightChart'
import WorkoutFrequencyChart from '../WorkoutFrequencyChart'
import WaterChart from '../WaterChart'

// Mock Recharts components — they don't render well in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLog(overrides: Partial<DailyLog> & { date: string }): DailyLog {
  return {
    trained: false,
    followedPlan: false,
    didSomethingDifferent: false,
    ...overrides,
  }
}

function dateOffset(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// ─── WeightChart ──────────────────────────────────────────────────────────────

describe('WeightChart', () => {
  it('renders the line chart when there are 2 or more weight logs', () => {
    const logs: DailyLog[] = [
      makeLog({ date: dateOffset(5), weight: 80 }),
      makeLog({ date: dateOffset(3), weight: 79.5 }),
      makeLog({ date: dateOffset(1), weight: 79 }),
    ]
    render(<WeightChart logs={logs} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('shows no-data message when there are fewer than 2 weight logs', () => {
    render(<WeightChart logs={[]} />)
    expect(
      screen.getByText('Sem dados suficientes para exibir o gráfico')
    ).toBeInTheDocument()
  })

  it('shows no-data message when only 1 weight log exists', () => {
    const logs: DailyLog[] = [makeLog({ date: dateOffset(1), weight: 80 })]
    render(<WeightChart logs={logs} />)
    expect(
      screen.getByText('Sem dados suficientes para exibir o gráfico')
    ).toBeInTheDocument()
  })

  it('ignores logs without weight when counting data points', () => {
    const logs: DailyLog[] = [
      makeLog({ date: dateOffset(3) }), // no weight
      makeLog({ date: dateOffset(1), weight: 79 }), // only 1 with weight
    ]
    render(<WeightChart logs={logs} />)
    expect(
      screen.getByText('Sem dados suficientes para exibir o gráfico')
    ).toBeInTheDocument()
  })

  it('renders chart with exactly 2 weight logs', () => {
    const logs: DailyLog[] = [
      makeLog({ date: dateOffset(2), weight: 80 }),
      makeLog({ date: dateOffset(1), weight: 79 }),
    ]
    render(<WeightChart logs={logs} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})

// ─── WorkoutFrequencyChart ────────────────────────────────────────────────────

describe('WorkoutFrequencyChart', () => {
  it('renders the bar chart when there are logs', () => {
    const logs: DailyLog[] = [
      makeLog({ date: dateOffset(2), trained: true }),
      makeLog({ date: dateOffset(1), trained: false }),
    ]
    render(<WorkoutFrequencyChart logs={logs} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows no-data message when logs array is empty', () => {
    render(<WorkoutFrequencyChart logs={[]} />)
    expect(
      screen.getByText('Sem dados suficientes para exibir o gráfico')
    ).toBeInTheDocument()
  })

  it('renders chart with a single log entry', () => {
    const logs: DailyLog[] = [makeLog({ date: dateOffset(1), trained: true })]
    render(<WorkoutFrequencyChart logs={logs} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders chart with logs spanning more than 30 days (only last 30 shown)', () => {
    const logs: DailyLog[] = Array.from({ length: 40 }, (_, i) =>
      makeLog({ date: dateOffset(i), trained: i % 2 === 0 })
    )
    render(<WorkoutFrequencyChart logs={logs} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})

// ─── WaterChart ───────────────────────────────────────────────────────────────

describe('WaterChart', () => {
  it('renders the bar chart when there are logs with waterLiters', () => {
    const logs: DailyLog[] = [
      makeLog({ date: dateOffset(2), waterLiters: 2.5 }),
      makeLog({ date: dateOffset(1), waterLiters: 3.0 }),
    ]
    render(<WaterChart logs={logs} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows no-data message when no logs have waterLiters', () => {
    render(<WaterChart logs={[]} />)
    expect(
      screen.getByText('Sem dados suficientes para exibir o gráfico')
    ).toBeInTheDocument()
  })

  it('shows no-data message when logs exist but none have waterLiters defined', () => {
    const logs: DailyLog[] = [
      makeLog({ date: dateOffset(2) }), // no waterLiters
      makeLog({ date: dateOffset(1) }), // no waterLiters
    ]
    render(<WaterChart logs={logs} />)
    expect(
      screen.getByText('Sem dados suficientes para exibir o gráfico')
    ).toBeInTheDocument()
  })

  it('renders chart when at least one log has waterLiters', () => {
    const logs: DailyLog[] = [
      makeLog({ date: dateOffset(3) }), // no waterLiters
      makeLog({ date: dateOffset(1), waterLiters: 2.0 }),
    ]
    render(<WaterChart logs={logs} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders chart covering last 7 days with 0 for missing days', () => {
    const logs: DailyLog[] = [makeLog({ date: dateOffset(6), waterLiters: 1.5 })]
    render(<WaterChart logs={logs} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})
