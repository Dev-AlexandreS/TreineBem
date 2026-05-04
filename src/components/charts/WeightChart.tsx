'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailyLog } from '@/types'

interface WeightChartProps {
  logs: DailyLog[]
}

const CHART_HEIGHT = 240

export default function WeightChart({ logs }: WeightChartProps) {
  // Filter logs that have weight defined, take last 30, sort by date ascending
  const data = logs
    .filter((log) => log.weight !== undefined && log.weight !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((log) => ({
      date: log.date.slice(5), // "MM-DD" for display
      weight: log.weight as number,
    }))

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ height: CHART_HEIGHT }}
      >
        Sem dados suficientes para exibir o gráfico
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#374151' }}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#374151' }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af' }}
          itemStyle={{ color: '#60a5fa' }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#60a5fa' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
