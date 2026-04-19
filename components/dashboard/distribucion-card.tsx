'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { positions, sectorData, regionData, assetTypeData, totalPortfolioValue } from '@/lib/mock-data'

const tabs = ['Posiciones', 'Sectores', 'Regiones', 'Tipo']

const positionsData = positions.map((p) => ({
  name: p.ticker,
  value: p.weight,
  color: p.color,
}))

const tabDataMap: Record<string, typeof positionsData> = {
  Posiciones: positionsData,
  Sectores: sectorData,
  Regiones: regionData,
  Tipo: assetTypeData,
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border/60 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-xs text-muted-foreground">{payload[0].value.toFixed(1)}%</p>
      </div>
    )
  }
  return null
}

export function DistribucionCard() {
  const [activeTab, setActiveTab] = useState('Posiciones')
  const data = tabDataMap[activeTab] ?? positionsData

  return (
    <div className="bg-surface-1 border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Distribución</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-1 rounded-lg text-xs font-medium transition-all',
              activeTab === tab
                ? 'bg-surface-3 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Donut + Legend */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0 w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-base font-bold text-foreground leading-none">
                {totalPortfolioValue.toLocaleString('es-ES', { notation: 'compact', maximumFractionDigits: 1 })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">EUR</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {data.slice(0, 6).map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
              <span className="text-xs font-medium text-foreground shrink-0">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
