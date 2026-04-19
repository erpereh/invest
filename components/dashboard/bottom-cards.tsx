'use client'

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ArrowUpRight, ArrowDownRight, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { positions, dividends, monthlyReturns } from '@/lib/mock-data'

// Sort positions by return for gainers/losers
const sorted = [...positions].sort((a, b) => b.return - a.return)
const topGainers = sorted.slice(0, 3)
const topLosers = sorted.slice(-3).reverse()

const MonthlyTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (active && payload && payload.length) {
    const v = payload[0].value
    return (
      <div className="bg-surface-2 border border-border/70 rounded-xl px-2.5 py-1.5 shadow-xl">
        <p className={cn('text-xs font-semibold', v >= 0 ? 'text-gain' : 'text-loss')}>
          {v >= 0 ? '+' : ''}{v.toFixed(2)}%
        </p>
      </div>
    )
  }
  return null
}

export function MejoresPeoresCard() {
  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mejores y peores</p>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground mb-2 font-medium">TOP GANADORAS</p>
          <div className="flex flex-col gap-2">
            {topGainers.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: p.color }}>
                    {p.initials}
                  </div>
                  <span className="text-xs font-medium text-foreground">{p.ticker}</span>
                </div>
                <div className="flex items-center gap-0.5 text-gain text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  +{p.return.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border/30" />
        <div>
          <p className="text-[10px] text-muted-foreground mb-2 font-medium">PEORES</p>
          <div className="flex flex-col gap-2">
            {topLosers.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: p.color }}>
                    {p.initials}
                  </div>
                  <span className="text-xs font-medium text-foreground">{p.ticker}</span>
                </div>
                <div className={cn('flex items-center gap-0.5 text-xs font-semibold', p.return >= 0 ? 'text-gain' : 'text-loss')}>
                  {p.return >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {p.return >= 0 ? '+' : ''}{p.return.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProximosDividendosCard() {
  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Próximos dividendos</p>
      </div>
      <div className="flex flex-col gap-3">
        {dividends.filter(d => d.amount > 0).map((d) => (
          <div key={d.id} className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{d.asset}</span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
                  d.status === 'Estimado' ? 'bg-blue-muted text-blue-accent' : 'bg-surface-3 text-foreground'
                )}>
                  {d.status}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gain">+{d.amount.toFixed(2)} €</p>
              <p className="text-[10px] text-muted-foreground">{d.perShare.toFixed(2)} €/acc</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RentabilidadMensualCard() {
  const ytdTotal = monthlyReturns.reduce((acc, m) => acc + m.value, 0)

  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rentabilidad mensual</p>
        <div className={cn('text-sm font-bold', ytdTotal >= 0 ? 'text-gain' : 'text-loss')}>
          {ytdTotal >= 0 ? '+' : ''}{ytdTotal.toFixed(2)}% YTD
        </div>
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyReturns} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'oklch(0.72 0.014 255)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'oklch(0.225 0.016 255)' }} />
            <Bar dataKey="value" radius={[4, 4, 2, 2]}>
              {monthlyReturns.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? 'oklch(0.65 0.17 145)' : 'oklch(0.58 0.22 25)'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-2.5 bg-surface-2/60 rounded-xl">
          <p className="text-[10px] text-muted-foreground mb-0.5">Mejor mes</p>
          <p className="text-xs font-bold text-gain">+5.3% Abr</p>
        </div>
        <div className="p-2.5 bg-surface-2/60 rounded-xl">
          <p className="text-[10px] text-muted-foreground mb-0.5">Peor mes</p>
          <p className="text-xs font-bold text-loss">-2.1% Feb</p>
        </div>
        <div className="p-2.5 bg-surface-2/60 rounded-xl">
          <p className="text-[10px] text-muted-foreground mb-0.5">Media</p>
          <p className="text-xs font-bold text-foreground">+{(ytdTotal / monthlyReturns.length).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  )
}
