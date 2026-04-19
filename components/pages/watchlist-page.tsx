'use client'

import { Plus, Star, ArrowUpRight, ArrowDownRight, Bell } from 'lucide-react'
import { watchlist } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function WatchlistPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Activos bajo seguimiento</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px">
          <Plus className="w-3.5 h-3.5" />
          Añadir activo
        </button>
      </div>

      <div className="bg-surface-1 border border-border/70 rounded-2xl overflow-hidden shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-3 pl-5 text-muted-foreground font-medium">Activo</th>
              <th className="text-right py-3 text-muted-foreground font-medium">Mercado</th>
              <th className="text-right py-3 text-muted-foreground font-medium">Precio</th>
              <th className="text-right py-3 text-muted-foreground font-medium">Variación</th>
              <th className="text-right py-3 pr-5 text-muted-foreground font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((item, i) => {
              const isPositive = item.change >= 0
              return (
                <tr
                  key={item.ticker}
                  className={cn(
                    'group transition-colors duration-150 ease-out hover:bg-surface-2/70',
                    i < watchlist.length - 1 && 'border-b border-border/20'
                  )}
                >
                  <td className="py-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-3 border border-border/60 flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/50" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.ticker}</p>
                        <p className="text-muted-foreground">{item.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="text-[10px] font-medium text-muted-foreground bg-surface-2 px-2 py-0.5 rounded-md">{item.market}</span>
                  </td>
                  <td className="py-3.5 text-right font-semibold text-foreground">
                    {item.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className={cn('flex items-center justify-end gap-0.5 font-semibold', isPositive ? 'text-gain' : 'text-loss')}>
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isPositive ? '+' : ''}{item.change.toFixed(2)}%
                    </div>
                    <p className={cn('text-[10px]', isPositive ? 'text-gain/85' : 'text-loss/85')}>
                      {isPositive ? '+' : ''}{item.changeAbs.toFixed(2)} €
                    </p>
                  </td>
                  <td className="py-3.5 pr-5 text-right">
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-surface-3 transition-[background-color,color,opacity,transform] duration-150 ease-out text-muted-foreground hover:text-foreground hover:-translate-y-px">
                      <Bell className="w-3.5 h-3.5" />
                    </button>
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
