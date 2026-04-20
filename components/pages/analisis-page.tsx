'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'
import { formatPercent } from '@/lib/data/format'

export function AnalisisPage({ data }: { data: PortfolioDashboardData }) {
  const comparison = data.evolution.map((point) => {
    const first = data.evolution[0]?.value || point.value
    return {
      date: point.date,
      Cartera: first > 0 ? ((point.value / first) - 1) * 100 : 0,
      Invertido: first > 0 ? ((point.invested / first) - 1) * 100 : 0,
    }
  })

  const riskMetrics = [
    { label: 'Fondos activos', value: String(data.summary.positions_count), note: 'Por ISIN' },
    { label: 'P/L total', value: formatPercent(data.summary.total_pnl_pct), note: 'Sobre invertido' },
    { label: 'NAVs cargados', value: String(data.latestNavs.length), note: 'Ultimo disponible' },
    { label: 'Movimientos', value: String(data.recentTransactions.length), note: 'Recientes' },
    { label: 'Region principal', value: data.groupedDistribution.regions[0]?.name ?? 'N/D', note: data.groupedDistribution.regions[0] ? `${data.groupedDistribution.regions[0].value.toFixed(1)}%` : 'Sin datos' },
    { label: 'Gestora principal', value: data.groupedDistribution.managers[0]?.name ?? 'N/D', note: data.groupedDistribution.managers[0] ? `${data.groupedDistribution.managers[0].value.toFixed(1)}%` : 'Sin datos' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analisis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Lectura privada de cartera de fondos indexados</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {riskMetrics.map((metric) => (
          <div key={metric.label} className="bg-surface-1 border border-border/70 rounded-2xl p-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
            <p className="text-[10px] text-muted-foreground mb-1.5 leading-tight">{metric.label}</p>
            <p className="text-lg font-bold text-foreground truncate">{metric.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{metric.note}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Evolucion vs capital invertido</p>
        <div className="h-72">
          {comparison.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparison} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.72 0.014 255)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.72 0.014 255)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`]} contentStyle={{ background: 'oklch(0.18 0.014 255)', border: '1px solid oklch(0.255 0.014 255)', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="Cartera" stroke="oklch(0.6 0.18 250)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Invertido" stroke="oklch(0.65 0.17 145)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-xl bg-surface-2/55 flex items-center justify-center text-xs text-muted-foreground">No hay snapshots para analizar.</div>
          )}
        </div>
      </div>
    </div>
  )
}
