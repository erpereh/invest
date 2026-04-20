'use client'

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ArrowUpRight, ArrowDownRight, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioEvolutionPoint } from '@/lib/data/portfolio'
import type { CurrentHolding, LatestFundNav } from '@/lib/supabase/types'
import { formatCurrency, formatPercent } from '@/lib/data/format'

const MonthlyTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return (
    <div className="bg-surface-2 border border-border/70 rounded-xl px-2.5 py-1.5 shadow-xl">
      <p className={cn('text-xs font-semibold', value >= 0 ? 'text-gain' : 'text-loss')}>{formatPercent(value)}</p>
    </div>
  )
}

export function MejoresPeoresCard({ holdings }: { holdings: CurrentHolding[] }) {
  const sorted = [...holdings].sort((a, b) => Number(b.pnl_pct ?? 0) - Number(a.pnl_pct ?? 0))
  const topGainers = sorted.slice(0, 3)
  const topLosers = sorted.slice(-3).reverse()

  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mejores y peores fondos</p>
      {holdings.length > 0 ? (
        <div className="flex flex-col gap-3">
          <FundList title="Top rentabilidad" items={topGainers} positive />
          <div className="border-t border-border/30" />
          <FundList title="Menor rentabilidad" items={topLosers} />
        </div>
      ) : (
        <EmptyText text="No hay posiciones para comparar." />
      )}
    </div>
  )
}

function FundList({ title, items, positive = false }: { title: string; items: CurrentHolding[]; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-2 font-medium">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isPositive = Number(item.pnl_pct ?? 0) >= 0
          return (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{item.isin}</span>
              <div className={cn('flex items-center gap-0.5 text-xs font-semibold', isPositive || positive ? 'text-gain' : 'text-loss')}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPercent(item.pnl_pct)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function UltimosNavsCard({ navs }: { navs: LatestFundNav[] }) {
  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ultimos NAVs</p>
      </div>
      {navs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {navs.slice(0, 5).map((nav) => (
            <div key={nav.fund_id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{nav.isin}</p>
                <p className="text-[11px] text-muted-foreground truncate">{nav.name}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(nav.nav_date).toLocaleDateString('es-ES')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-foreground">{formatCurrency(Number(nav.nav), 4)}</p>
                <p className="text-[10px] text-muted-foreground">{nav.source}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText text="Aun no hay NAVs guardados." />
      )}
    </div>
  )
}

export function RentabilidadMensualCard({ evolution }: { evolution: PortfolioEvolutionPoint[] }) {
  const monthlyReturns = buildMonthlyReturns(evolution)
  const ytdTotal = monthlyReturns.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Evolucion mensual</p>
        <div className={cn('text-sm font-bold', ytdTotal >= 0 ? 'text-gain' : 'text-loss')}>{formatPercent(ytdTotal)} YTD</div>
      </div>

      {monthlyReturns.length > 0 ? (
        <>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReturns} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'oklch(0.72 0.014 255)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'oklch(0.225 0.016 255)' }} />
                <Bar dataKey="value" radius={[4, 4, 2, 2]}>
                  {monthlyReturns.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'oklch(0.65 0.17 145)' : 'oklch(0.58 0.22 25)'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Mejor mes" value={best(monthlyReturns)} tone="gain" />
            <Metric label="Peor mes" value={worst(monthlyReturns)} tone="loss" />
            <Metric label="Media" value={formatPercent(ytdTotal / monthlyReturns.length, 1)} />
          </div>
        </>
      ) : (
        <EmptyText text="No hay evolucion mensual suficiente." />
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="p-2.5 bg-surface-2/60 rounded-xl">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn('text-xs font-bold', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss', !tone && 'text-foreground')}>{value}</p>
    </div>
  )
}

function EmptyText({ text }: { text: string }) {
  return <div className="min-h-28 rounded-xl bg-surface-2/55 flex items-center justify-center text-xs text-muted-foreground text-center px-4">{text}</div>
}

function buildMonthlyReturns(evolution: PortfolioEvolutionPoint[]) {
  const byMonth = new Map<string, PortfolioEvolutionPoint[]>()
  for (const point of evolution) {
    const month = point.date.slice(0, 7)
    byMonth.set(month, [...(byMonth.get(month) ?? []), point])
  }

  return Array.from(byMonth.entries()).slice(-7).map(([month, points]) => {
    const first = points[0]
    const last = points[points.length - 1]
    const value = first.value > 0 ? ((last.value - first.value) / first.value) * 100 : 0
    return { month: month.slice(5), value }
  })
}

function best(rows: { month: string; value: number }[]) {
  const item = [...rows].sort((a, b) => b.value - a.value)[0]
  return item ? `${formatPercent(item.value, 1)} ${item.month}` : 'N/D'
}

function worst(rows: { month: string; value: number }[]) {
  const item = [...rows].sort((a, b) => a.value - b.value)[0]
  return item ? `${formatPercent(item.value, 1)} ${item.month}` : 'N/D'
}
