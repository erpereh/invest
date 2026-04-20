'use client'

import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CurrentHolding } from '@/lib/supabase/types'
import { formatCurrency, formatPercent, fundInitials } from '@/lib/data/format'

interface PosicionesCardProps {
  holdings: CurrentHolding[]
}

export function PosicionesCard({ holdings }: PosicionesCardProps) {
  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Posiciones</p>
        <button className="text-xs text-primary hover:text-primary/85 transition-colors duration-150 ease-out font-medium flex items-center gap-1">
          Fondos indexados <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[760px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-2.5 pl-1 text-muted-foreground font-medium">Fondo</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Particip.</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Coste medio</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">NAV</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Valor</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Peso</th>
              <th className="text-right pb-2.5 pr-1 text-muted-foreground font-medium">Rentab.</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length > 0 ? holdings.map((pos, index) => {
              const isPositive = Number(pos.pnl_eur) >= 0
              return (
                <tr key={pos.id} className={cn('group transition-colors duration-150 ease-out hover:bg-surface-2/70', index < holdings.length - 1 && 'border-b border-border/20')}>
                  <td className="py-2.5 pl-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-primary/80">
                        {fundInitials(pos.fund_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{pos.isin}</span>
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-muted text-blue-accent">
                            Fondo indexado
                          </span>
                        </div>
                        <span className="text-muted-foreground truncate block max-w-[220px]">{pos.fund_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{Number(pos.shares).toFixed(4)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{formatCurrency(Number(pos.avg_cost), 4)}</td>
                  <td className="py-2.5 text-right text-foreground font-medium">{formatCurrency(Number(pos.nav), 4)}</td>
                  <td className="py-2.5 text-right text-foreground font-semibold">{formatCurrency(Number(pos.market_value), 0)}</td>
                  <td className="py-2.5 text-right">
                    <span className="text-muted-foreground">{calculateWeight(pos, holdings).toFixed(1)}%</span>
                  </td>
                  <td className="py-2.5 text-right pr-1">
                    <div className={cn('flex items-center justify-end gap-0.5 font-semibold', isPositive ? 'text-gain' : 'text-loss')}>
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{formatPercent(pos.pnl_pct)}</span>
                    </div>
                    <div className={cn('text-[10px]', isPositive ? 'text-gain/85' : 'text-loss/85')}>
                      {pos.pnl_eur >= 0 ? '+' : ''}{formatCurrency(Number(pos.pnl_eur), 2)}
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">
                  No hay posiciones. Importa movimientos y NAVs para empezar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function calculateWeight(pos: CurrentHolding, holdings: CurrentHolding[]) {
  const total = holdings.reduce((acc, item) => acc + Number(item.market_value ?? 0), 0)
  return total > 0 ? (Number(pos.market_value) / total) * 100 : 0
}
