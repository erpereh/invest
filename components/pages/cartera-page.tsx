'use client'

import { BarChart2, TrendingUp, DollarSign, Percent } from 'lucide-react'
import { PosicionesCard } from '@/components/dashboard/posiciones-card'
import { DistribucionCard } from '@/components/dashboard/distribucion-card'
import { cn } from '@/lib/utils'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'
import { formatCurrency, formatPercent } from '@/lib/data/format'

interface CarteraPageProps {
  data: PortfolioDashboardData
}

export function CarteraPage({ data }: CarteraPageProps) {
  const stats = [
    { label: 'Valor total', value: formatCurrency(data.summary.total_market_value, 0), icon: DollarSign, color: 'text-blue-accent' },
    { label: 'Invertido', value: formatCurrency(data.summary.total_invested_amount, 0), icon: BarChart2, color: 'text-muted-foreground' },
    { label: 'P/L total', value: `${data.summary.total_pnl_eur >= 0 ? '+' : ''}${formatCurrency(data.summary.total_pnl_eur, 0)}`, icon: TrendingUp, color: data.summary.total_pnl_eur >= 0 ? 'text-gain' : 'text-loss' },
    { label: 'Rentabilidad', value: formatPercent(data.summary.total_pnl_pct), icon: Percent, color: Number(data.summary.total_pnl_pct ?? 0) >= 0 ? 'text-gain' : 'text-loss' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mi cartera</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{data.summary.positions_count} fondos indexados valorados por ISIN</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-surface-1 border border-border/70 rounded-2xl p-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-3.5 h-3.5', stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PosicionesCard holdings={data.holdings} />
        </div>
        <div>
          <DistribucionCard data={data} />
        </div>
      </div>
    </div>
  )
}
