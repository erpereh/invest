'use client'

import { useState } from 'react'
import { Sparkles, AlertTriangle, TrendingUp, Globe, Zap, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const insights = [
  {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    title: 'Concentración elevada',
    desc: 'IWDA representa el 30.9% de la cartera. Considera diversificar si supera el 35%.',
  },
  {
    icon: TrendingUp,
    color: 'text-gain',
    bg: 'bg-gain-muted',
    title: 'Mejor rendimiento',
    desc: 'MSFT lidera con un +22.15%. Apple y VWCE también superan el benchmark anual.',
  },
  {
    icon: Globe,
    color: 'text-blue-accent',
    bg: 'bg-blue-muted',
    title: 'Exposición EEUU: 55.3%',
    desc: 'Alta dependencia al mercado americano. Los mercados emergentes solo pesan un 9.5%.',
  },
  {
    icon: AlertTriangle,
    color: 'text-loss',
    bg: 'bg-loss-muted',
    title: 'Posición en pérdidas',
    desc: 'BRK.B y EIMI están por debajo del precio de compra. Evalúa tu tesis de inversión.',
  },
  {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    title: 'Dividendos próximos',
    desc: 'AAPL paga dividendo el 15 may. MSFT y VWCE en junio-julio.',
  },
]

export function InsightsCard() {
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="bg-surface-1 border border-border/60 rounded-2xl p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Insights</p>
        </div>
        <button
          onClick={handleGenerate}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all',
            loading && 'opacity-70 cursor-not-allowed'
          )}
          disabled={loading}
        >
          <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          {loading ? 'Analizando…' : 'Actualizar'}
        </button>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {insights.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-2/50 hover:bg-surface-2 transition-colors">
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
