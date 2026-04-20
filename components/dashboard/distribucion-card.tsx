'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import type { PortfolioDashboardData, DistributionSlice } from '@/lib/data/portfolio'
import { formatCurrency } from '@/lib/data/format'

const tabs = ['Fondos', 'Regiones', 'Categorias', 'Gestoras']
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#8b5cf6', '#64748b', '#14b8a6']

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: DistributionSlice }> }) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-surface-2 border border-border/70 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground">{item.name}</p>
      <p className="text-xs text-muted-foreground">{item.value.toFixed(1)}%</p>
      <p className="text-xs text-muted-foreground">{formatCurrency(item.payload.marketValue, 0)}</p>
    </div>
  )
}

interface DistribucionCardProps {
  data: PortfolioDashboardData
}

export function DistribucionCard({ data }: DistribucionCardProps) {
  const [activeTab, setActiveTab] = useState('Fondos')
  const dataMap: Record<string, DistributionSlice[]> = {
    Fondos: data.groupedDistribution.funds,
    Regiones: data.groupedDistribution.regions,
    Categorias: data.groupedDistribution.categories,
    Gestoras: data.groupedDistribution.managers,
  }
  const slices = dataMap[activeTab] ?? []

  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Distribucion</p>
      </div>

      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('flex-1 py-1 rounded-lg text-xs font-medium transition-[background-color,color,box-shadow] duration-150 ease-out', activeTab === tab ? 'bg-surface-3 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-3/55')}
          >
            {tab}
          </button>
        ))}
      </div>

      {slices.length > 0 ? (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {slices.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-base font-bold text-foreground leading-none">
                  {formatCurrency(data.summary.total_market_value, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Total</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {slices.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                <span className="text-xs font-medium text-foreground shrink-0">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-32 rounded-xl bg-surface-2/55 flex items-center justify-center text-xs text-muted-foreground text-center px-4">
          Aun no hay posiciones valoradas para calcular distribucion.
        </div>
      )}
    </div>
  )
}
