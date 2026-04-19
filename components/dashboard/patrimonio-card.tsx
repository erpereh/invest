'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  portfolioHistory,
  portfolioHistoryDaily,
  portfolioHistoryWeek,
  totalPortfolioValue,
  dailyChange,
  dailyChangePct,
  totalReturn,
  totalReturnPct,
} from '@/lib/mock-data'

const ranges = [
  { label: '1D', data: portfolioHistoryDaily },
  { label: '1S', data: portfolioHistoryWeek },
  { label: '1M', data: portfolioHistory.slice(-1).concat(portfolioHistory.slice(-4)) },
  { label: 'YTD', data: portfolioHistory.slice(-4) },
  { label: '1A', data: portfolioHistory.slice(-12) },
  { label: 'Máx', data: portfolioHistory },
]

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border/60 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs font-semibold text-foreground">
          {payload[0].value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
        </p>
      </div>
    )
  }
  return null
}

export function PatrimonioCard() {
  const [activeRange, setActiveRange] = useState('Máx')
  const currentData = ranges.find((r) => r.label === activeRange)?.data ?? portfolioHistory
  const isPositive = dailyChangePct >= 0

  return (
    <div className="bg-surface-1 border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Patrimonio total</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-foreground tracking-tight">
              {totalPortfolioValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </span>
            <div className={cn(
              'flex items-center gap-1 text-sm font-semibold mb-0.5 px-2 py-0.5 rounded-lg',
              isPositive ? 'text-gain bg-gain-muted' : 'text-loss bg-loss-muted'
            )}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{dailyChangePct.toFixed(2)}%</span>
            </div>
          </div>
          <p className={cn(
            'text-sm font-medium mt-0.5',
            isPositive ? 'text-gain' : 'text-loss'
          )}>
            {isPositive ? '+' : ''}{dailyChange.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} hoy
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground mb-1">Rentabilidad total</p>
          <div className="flex items-center gap-1 justify-end text-gain">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-bold">+{totalReturnPct.toFixed(2)}%</span>
          </div>
          <p className="text-xs text-gain/80 mt-0.5">
            +{totalReturn.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 w-full -mx-1">
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="oklch(0.6 0.18 250)"
              strokeWidth={2}
              fill="url(#portfolioGrad)"
              dot={false}
              activeDot={{ r: 4, fill: 'oklch(0.6 0.18 250)', stroke: 'transparent' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Range filters */}
      <div className="flex items-center gap-1">
        {ranges.map((r) => (
          <button
            key={r.label}
            onClick={() => setActiveRange(r.label)}
            className={cn(
              'flex-1 py-1 rounded-lg text-xs font-medium transition-all',
              activeRange === r.label
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-3/60'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
