import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Mock useDashboard ────────────────────────────────────────────────────────

vi.mock('@/hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
}))

// ─── Mock chart components (they use Recharts which doesn't work in jsdom) ───

vi.mock('@/components/charts/WeightChart', () => ({
  default: () => <div data-testid="weight-chart" />,
}))

vi.mock('@/components/charts/WorkoutFrequencyChart', () => ({
  default: () => <div data-testid="workout-frequency-chart" />,
}))

vi.mock('@/components/charts/WaterChart', () => ({
  default: () => <div data-testid="water-chart" />,
}))

// ─── Import after mocks ───────────────────────────────────────────────────────

import { useDashboard } from '@/hooks/useDashboard'
import DashboardPage from '../page'
import type { DayPlan, DailyLog } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLog(date: string, overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    date,
    trained: false,
    followedPlan: false,
    didSomethingDifferent: false,
    ...overrides,
  }
}

const workoutDayPlan: DayPlan = {
  dayType: 'workout',
  exercises: [
    {
      id: 'ex-1',
      name: 'Supino reto',
      muscleGroup: 'chest',
      plannedSets: 3,
      plannedReps: '10–12',
    },
    {
      id: 'ex-2',
      name: 'Tríceps corda',
      muscleGroup: 'triceps',
      plannedSets: 3,
      plannedReps: '12–15',
    },
  ],
}

const defaultDashboardData = {
  currentWeight: 85.5,
  targetWeight: 80.0,
  weightLost: 4.5,
  streak: 7,
  weeklyCompletionRate: 0.75,
  averageWater: 2.3,
  todayPlan: workoutDayPlan,
  todayDayType: 'workout' as const,
  allLogs: [makeLog('2024-01-01', { weight: 90 }), makeLog('2024-01-02', { weight: 89 })],
  weeklyPlan: null,
  goals: null,
  isLoading: false,
  error: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Requirement 1.1: Dashboard is the initial screen ─────────────────────────

  it('renders the dashboard heading', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  // ── Requirement 1.2: current weight card ─────────────────────────────────────

  it('renders the current weight MetricCard with the correct value', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText('Peso atual')).toBeInTheDocument()
    expect(screen.getByText('85.5')).toBeInTheDocument()
  })

  // ── Requirement 1.3: weight goal card ────────────────────────────────────────

  it('renders the weight goal MetricCard with the correct value', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText('Meta de peso')).toBeInTheDocument()
    expect(screen.getByText('80.0')).toBeInTheDocument()
  })

  // ── Requirement 1.4: weight lost card ────────────────────────────────────────

  it('renders the weight lost MetricCard with the correct value', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText('Peso perdido')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  // ── Requirement 1.5: streak card ─────────────────────────────────────────────

  it('renders the streak MetricCard with the correct value', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText('Streak')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  // ── Requirement 1.6: weekly completion rate card ──────────────────────────────

  it('renders the weekly completion rate as a percentage', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText('Semana')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  // ── Requirement 1.7: average water card ──────────────────────────────────────

  it('renders the average water MetricCard with the correct value', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText('Água média')).toBeInTheDocument()
    expect(screen.getByText('2.3')).toBeInTheDocument()
  })

  // ── Requirement 1.8: today's workout card ────────────────────────────────────

  it('renders today workout exercises when todayPlan has exercises', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByText(/Supino reto/)).toBeInTheDocument()
    expect(screen.getByText(/Tríceps corda/)).toBeInTheDocument()
  })

  // ── Requirement 1.9: "Dia de descanso" when no workout planned ───────────────

  it('shows "Dia de descanso" when todayPlan is null', () => {
    vi.mocked(useDashboard).mockReturnValue({
      ...defaultDashboardData,
      todayPlan: null,
      todayDayType: null,
    })
    render(<DashboardPage />)
    expect(screen.getByText('Dia de descanso')).toBeInTheDocument()
  })

  it('shows "Dia de descanso" when todayDayType is "rest"', () => {
    vi.mocked(useDashboard).mockReturnValue({
      ...defaultDashboardData,
      todayPlan: { dayType: 'rest', exercises: [] },
      todayDayType: 'rest',
    })
    render(<DashboardPage />)
    expect(screen.getByText('Dia de descanso')).toBeInTheDocument()
  })

  // ── Requirement 1.10–1.12: charts are rendered ───────────────────────────────

  it('renders WeightChart, WorkoutFrequencyChart and WaterChart', () => {
    vi.mocked(useDashboard).mockReturnValue(defaultDashboardData)
    render(<DashboardPage />)
    expect(screen.getByTestId('weight-chart')).toBeInTheDocument()
    expect(screen.getByTestId('workout-frequency-chart')).toBeInTheDocument()
    expect(screen.getByTestId('water-chart')).toBeInTheDocument()
  })

  // ── Loading state ─────────────────────────────────────────────────────────────

  it('renders a loading spinner while data is loading', () => {
    vi.mocked(useDashboard).mockReturnValue({
      ...defaultDashboardData,
      isLoading: true,
    })
    render(<DashboardPage />)
    // Dashboard content should not be visible
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  // ── Null metric values display "—" ────────────────────────────────────────────

  it('displays "—" for null metric values (no data yet)', () => {
    vi.mocked(useDashboard).mockReturnValue({
      ...defaultDashboardData,
      currentWeight: null,
      targetWeight: null,
      weightLost: null,
    })
    render(<DashboardPage />)
    // MetricCard renders "—" for null values
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })
})
