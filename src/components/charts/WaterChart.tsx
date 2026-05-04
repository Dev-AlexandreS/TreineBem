'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailyLog } from '@/types'

interface WaterChartProps {
  logs: DailyLog[]
}

const CHART_HEIGHT = 240

function getLastNDates(n: number): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function WaterChart({ logs }: WaterChartProps) {
  const logsWithWater = logs.filter(
    (log) => log.waterLiters !== undefined && log.waterLiters !== null
  )

  if (logsWithWater.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ height: CHART_HEIGHT }}
      >
        Sem dados suficientes para exibir o gráfico
      </div>
    )
  }

  const logMap = new Map(logs.map((log) => [log.date, log]))
  const last7 = getLastNDates(7)

  const data = last7.map((date) => {
    const log = logMap.get(date)
    return {
      date: date.slice(5), // "MM-DD"
      water: log?.waterLiters ?? 0,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
          domain={[0, 'auto']}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af' }}
          itemStyle={{ color: '#60a5fa' }}
          formatter={(value) => [`${value} L`, 'Água']}
        />
        <Bar dataKey="water" fill="#60a5fa" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
