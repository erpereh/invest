'use client'

import { useMemo, useState } from 'react'
import { Sparkles, AlertTriangle, TrendingUp, Globe, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'
import { formatPercent } from '@/lib/data/format'

interface InsightsCardProps {
  data: PortfolioDashboardData
}

export function InsightsCard({ data }: InsightsCardProps) {
  const [loading, setLoading] = useState(false)
  const [remoteInsight, setRemoteInsight] = useState<string | null>(null)

  const insights = useMemo(() => buildInsights(data), [data])

  async function handleGenerate() {
    setLoading(true)
    setRemoteInsight(null)
    const response = await fetch('/api/ai/portfolio-analysis', { method: 'POST' })
    const result = await response.json()
    setLoading(false)
    if (!response.ok || !result.ok) {
      setRemoteInsight(result.error ?? 'No se pudo generar el analisis.')
      return
    }
    const first = result.analysis?.insights?.[0]
    setRemoteInsight(first ? `${first.title}: ${first.description}` : 'Analisis generado sin observaciones relevantes.')
  }

  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 h-full shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Insights</p>
        </div>
        <button
          onClick={handleGenerate}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px', loading && 'opacity-70 cursor-not-allowed')}
          disabled={loading}
        >
          <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          {loading ? 'Analizando...' : 'IA'}
        </button>
      </div>

      {remoteInsight ? <div className="text-[11px] text-primary bg-primary/10 rounded-xl p-3">{remoteInsight}</div> : null}

      <div className="flex flex-col gap-3 flex-1">
        {insights.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-surface-2/55 hover:bg-surface-2 transition-colors duration-150 ease-out">
              <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', item.bg)}>
                <Icon className={cn('w-3 h-3', item.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground mb-0.5">{item.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildInsights(data: PortfolioDashboardData) {
  const topHolding = data.holdings[0]
  const worstHolding = [...data.holdings].sort((a, b) => Number(a.pnl_pct ?? 0) - Number(b.pnl_pct ?? 0))[0]
  const topRegion = data.groupedDistribution.regions[0]

  return [
    {
      icon: AlertTriangle,
      color: topHolding && calculateWeight(topHolding, data) > 35 ? 'text-yellow-500' : 'text-blue-accent',
      bg: topHolding && calculateWeight(topHolding, data) > 35 ? 'bg-yellow-500/10' : 'bg-blue-muted',
      title: topHolding ? `Mayor peso: ${topHolding.isin}` : 'Sin posiciones valoradas',
      desc: topHolding ? `${topHolding.fund_name} pesa ${calculateWeight(topHolding, data).toFixed(1)}% de la cartera.` : 'Importa movimientos y NAVs para generar lectura de concentracion.',
    },
    {
      icon: TrendingUp,
      color: 'text-gain',
      bg: 'bg-gain-muted',
      title: `Rentabilidad total ${formatPercent(data.summary.total_pnl_pct)}`,
      desc: `P/L acumulado: ${data.summary.total_pnl_eur.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}.`,
    },
    {
      icon: Globe,
      color: 'text-blue-accent',
      bg: 'bg-blue-muted',
      title: topRegion ? `Region principal: ${topRegion.name}` : 'Distribucion pendiente',
      desc: topRegion ? `${topRegion.name} concentra el ${topRegion.value.toFixed(1)}% del valor.` : 'No hay holdings suficientes para calcular regiones.',
    },
    {
      icon: AlertTriangle,
      color: worstHolding && Number(worstHolding.pnl_eur) < 0 ? 'text-loss' : 'text-muted-foreground',
      bg: worstHolding && Number(worstHolding.pnl_eur) < 0 ? 'bg-loss-muted' : 'bg-surface-3',
      title: worstHolding ? `Peor posicion: ${worstHolding.isin}` : 'Sin perdidas detectadas',
      desc: worstHolding ? `${worstHolding.fund_name}: ${formatPercent(worstHolding.pnl_pct)}.` : 'No hay posiciones para comparar.',
    },
  ]
}

function calculateWeight(holding: { market_value: number }, data: PortfolioDashboardData) {
  const total = data.summary.total_market_value
  return total > 0 ? (Number(holding.market_value) / total) * 100 : 0
}
