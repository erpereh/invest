'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioEvolutionPoint } from '@/lib/data/portfolio'
import type { PortfolioSummary } from '@/lib/supabase/types'
import { formatCurrency, formatPercent } from '@/lib/data/format'

const ranges = ['1M', '3M', '1A', 'Max']

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border/70 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground">{formatCurrency(payload[0].value, 0)}</p>
    </div>
  )
}

interface PatrimonioCardProps {
  summary: PortfolioSummary
  evolution: PortfolioEvolutionPoint[]
}

export function PatrimonioCard({ summary, evolution }: PatrimonioCardProps) {
  const [activeRange, setActiveRange] = useState('Max')
  const currentData = filterRange(evolution, activeRange)
  const pnlPct = summary.total_pnl_pct ?? 0
  const isPositive = pnlPct >= 0

  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Patrimonio total</p>
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-3xl font-bold text-foreground tracking-tight">
              {formatCurrency(summary.total_market_value, 0)}
            </span>
            <div className={cn('flex items-center gap-1 text-sm font-semibold mb-0.5 px-2 py-0.5 rounded-lg', isPositive ? 'text-gain bg-gain-muted' : 'text-loss bg-loss-muted')}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{formatPercent(summary.total_pnl_pct)}</span>
            </div>
          </div>
          <p className={cn('text-sm font-medium mt-0.5', isPositive ? 'text-gain' : 'text-loss')}>
            {summary.total_pnl_eur >= 0 ? '+' : ''}{formatCurrency(summary.total_pnl_eur, 2)} P/L total
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground mb-1">Capital invertido</p>
          <div className="flex items-center gap-1 justify-end text-foreground">
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold">{formatCurrency(summary.total_invested_amount, 0)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summary.positions_count} posiciones activas
          </p>
        </div>
      </div>

      <div className="h-40 w-full -mx-1">
        {currentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.6 0.18 250)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="oklch(0.6 0.18 250)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="oklch(0.6 0.18 250)" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4, fill: 'oklch(0.6 0.18 250)', stroke: 'transparent' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-xl bg-surface-2/55 flex items-center justify-center text-xs text-muted-foreground">
            Anade transacciones y NAVs para ver la evolucion.
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => setActiveRange(range)}
            className={cn('flex-1 py-1 rounded-lg text-xs font-medium transition-[background-color,color,box-shadow] duration-150 ease-out', activeRange === range ? 'bg-primary/18 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-3/75')}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}

function filterRange(data: PortfolioEvolutionPoint[], range: string) {
  if (range === 'Max') return data
  const limits: Record<string, number> = { '1M': 31, '3M': 93, '1A': 366 }
  return data.slice(-limits[range])
}
