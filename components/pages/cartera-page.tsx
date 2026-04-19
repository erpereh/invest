'use client'

import { BarChart2, TrendingUp, DollarSign, Percent } from 'lucide-react'
import { positions, totalPortfolioValue, totalReturn, totalReturnPct, totalInvested } from '@/lib/mock-data'
import { PosicionesCard } from '@/components/dashboard/posiciones-card'
import { DistribucionCard } from '@/components/dashboard/distribucion-card'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Valor total', value: totalPortfolioValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }), icon: DollarSign, color: 'text-blue-accent' },
  { label: 'Invertido', value: totalInvested.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }), icon: BarChart2, color: 'text-muted-foreground' },
  { label: 'Ganancia total', value: `+${totalReturn.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-gain' },
  { label: 'Rentabilidad', value: `+${totalReturnPct.toFixed(2)}%`, icon: Percent, color: 'text-gain' },
]

export function CarteraPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mi Cartera</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{positions.length} posiciones activas</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-surface-1 border border-border/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-3.5 h-3.5', s.color)} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Distribution + Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PosicionesCard />
        </div>
        <div>
          <DistribucionCard />
        </div>
      </div>
    </div>
  )
}
