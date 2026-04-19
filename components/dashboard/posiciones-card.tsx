'use client'

import { MoreHorizontal, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { positions } from '@/lib/mock-data'

const typeBadgeColors: Record<string, string> = {
  ETF: 'bg-blue-muted text-blue-accent',
  Acción: 'bg-surface-3 text-foreground',
  Fondo: 'bg-[oklch(0.25_0.06_145)] text-gain',
}

export function PosicionesCard() {
  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Posiciones</p>
        <button className="text-xs text-primary hover:text-primary/85 transition-colors duration-150 ease-out font-medium flex items-center gap-1">
          Ver todas <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[680px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-2.5 pl-1 text-muted-foreground font-medium">Activo</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Cantidad</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">P. Medio</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">P. Actual</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Valor</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Peso</th>
              <th className="text-right pb-2.5 pr-1 text-muted-foreground font-medium">Rentab.</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => {
              const isPositive = pos.return >= 0
              return (
                <tr
                  key={pos.id}
                  className={cn(
                    'group transition-colors duration-150 ease-out hover:bg-surface-2/70',
                    i < positions.length - 1 && 'border-b border-border/20'
                  )}
                >
                  {/* Asset info */}
                  <td className="py-2.5 pl-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: pos.color }}
                      >
                        {pos.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{pos.ticker}</span>
                          <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors duration-150 ease-out', typeBadgeColors[pos.type] ?? 'bg-surface-3 text-foreground')}>
                            {pos.type}
                          </span>
                        </div>
                        <span className="text-muted-foreground truncate block max-w-[160px]">{pos.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{pos.quantity}</td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {pos.avgPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="py-2.5 text-right text-foreground font-medium">
                    {pos.currentPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="py-2.5 text-right text-foreground font-semibold">
                    {pos.value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </td>
                  {/* Weight bar */}
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 bg-surface-3 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.min(pos.weight / 35 * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-10 text-right">{pos.weight.toFixed(1)}%</span>
                    </div>
                  </td>
                  {/* Return */}
                  <td className="py-2.5 text-right pr-1">
                    <div className={cn(
                      'flex items-center justify-end gap-0.5 font-semibold',
                      isPositive ? 'text-gain' : 'text-loss'
                    )}>
                      {isPositive
                        ? <ArrowUpRight className="w-3.5 h-3.5" />
                        : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isPositive ? '+' : ''}{pos.return.toFixed(2)}%</span>
                    </div>
                    <div className={cn(
                      'text-[10px]',
                      isPositive ? 'text-gain/85' : 'text-loss/85'
                    )}>
                      {isPositive ? '+' : ''}{pos.returnAbs.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
