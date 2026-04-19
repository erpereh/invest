'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CalendarClock, DollarSign, TrendingUp } from 'lucide-react'
import { dividends } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const annualData = [
  { year: '2022', total: 48.20 },
  { year: '2023', total: 87.50 },
  { year: '2024', total: 142.30 },
  { year: '2025', total: 135.25 },
]

const stats = [
  { label: 'Total cobrado (2025)', value: '22.25 €', icon: DollarSign, color: 'text-blue-accent' },
  { label: 'Estimado próx. 12m', value: '135.25 €', icon: CalendarClock, color: 'text-gain' },
  { label: 'Yield medio cartera', value: '0.21%', icon: TrendingUp, color: 'text-muted-foreground' },
]

export function DividendosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dividendos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ingresos por dividendos e historial</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming dividends */}
        <div className="bg-surface-1 border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Próximos pagos estimados</p>
          <div className="flex flex-col gap-3">
            {dividends.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-surface-2/40 rounded-xl hover:bg-surface-2 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{d.asset}</span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      d.status === 'Estimado' ? 'bg-blue-muted text-blue-accent' : 'bg-surface-3 text-muted-foreground'
                    )}>
                      {d.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{d.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {d.amount > 0 ? (
                  <div className="text-right">
                    <p className="text-sm font-bold text-gain">+{d.amount.toFixed(2)} €</p>
                    <p className="text-[10px] text-muted-foreground">{d.perShare.toFixed(2)} €/acc</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sin dividendo</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Annual chart */}
        <div className="bg-surface-1 border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dividendos anuales</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'oklch(0.5 0 0)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.5 0 0)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(2)} €`, 'Total']}
                  contentStyle={{ background: 'oklch(0.14 0 0)', border: '1px solid oklch(0.18 0 0)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total" radius={[6, 6, 2, 2]}>
                  {annualData.map((_, i) => (
                    <Cell key={i} fill="oklch(0.65 0.17 145)" fillOpacity={i === annualData.length - 1 ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-surface-2/60 rounded-xl">
              <p className="text-[10px] text-muted-foreground mb-0.5">Crecimiento YoY</p>
              <p className="text-sm font-bold text-gain">+62.6%</p>
            </div>
            <div className="p-3 bg-surface-2/60 rounded-xl">
              <p className="text-[10px] text-muted-foreground mb-0.5">Mejor año</p>
              <p className="text-sm font-bold text-foreground">2024 · 142.30 €</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
