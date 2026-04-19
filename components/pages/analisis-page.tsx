'use client'

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { portfolioHistory } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const benchmarkData = portfolioHistory.slice(-12).map((d, i) => ({
  date: d.date,
  Cartera: ((d.value / portfolioHistory[portfolioHistory.length - 13].value) - 1) * 100,
  'MSCI World': (Math.sin(i * 0.5) * 4 + i * 1.1),
  'S&P 500': (Math.sin(i * 0.6) * 3 + i * 1.3),
}))

const radarData = [
  { metric: 'Diversif.', value: 72 },
  { metric: 'Rentab.', value: 85 },
  { metric: 'Riesgo', value: 45 },
  { metric: 'Liquidez', value: 90 },
  { metric: 'Geogr.', value: 65 },
  { metric: 'Sectores', value: 60 },
]

const riskMetrics = [
  { label: 'Volatilidad anual', value: '12.4%', note: 'Moderada', color: 'text-yellow-400' },
  { label: 'Sharpe Ratio', value: '1.38', note: 'Bueno', color: 'text-gain' },
  { label: 'Beta vs MSCI World', value: '0.92', note: 'Defensiva', color: 'text-blue-accent' },
  { label: 'Max Drawdown', value: '-11.8%', note: 'Aceptable', color: 'text-muted-foreground' },
  { label: 'Correlación S&P', value: '0.87', note: 'Alta', color: 'text-yellow-400' },
  { label: 'Tracking Error', value: '3.2%', note: 'Bajo', color: 'text-gain' },
]

export function AnalisisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Análisis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Rendimiento, riesgo y comparativas</p>
      </div>

      {/* Risk metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {riskMetrics.map((m) => (
          <div key={m.label} className="bg-surface-1 border border-border/70 rounded-2xl p-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
            <p className="text-[10px] text-muted-foreground mb-1.5 leading-tight">{m.label}</p>
            <p className={cn('text-lg font-bold', m.color)}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Benchmark comparison */}
        <div className="lg:col-span-2 bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Comparativa vs benchmarks (12m)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={benchmarkData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.72 0.014 255)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.72 0.014 255)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(2)}%`]}
                  contentStyle={{ background: 'oklch(0.18 0.014 255)', border: '1px solid oklch(0.255 0.014 255)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="Cartera" stroke="oklch(0.6 0.18 250)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MSCI World" stroke="oklch(0.65 0.17 145)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="S&P 500" stroke="oklch(0.58 0.22 25)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score cartera</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <PolarGrid stroke="oklch(0.255 0.014 255)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'oklch(0.72 0.014 255)' }} />
                <Radar
                  dataKey="value"
                  stroke="oklch(0.6 0.18 250)"
                  fill="oklch(0.6 0.18 250)"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">74</p>
            <p className="text-xs text-muted-foreground mt-0.5">Score global</p>
          </div>
        </div>
      </div>
    </div>
  )
}
