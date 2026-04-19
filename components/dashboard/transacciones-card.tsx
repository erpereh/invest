'use client'

import { useState } from 'react'
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, DollarSign, MinusCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { transactions } from '@/lib/mock-data'

const typeFilters = ['Todas', 'Compra', 'Venta', 'Dividendo', 'Comisión', 'Ingreso']

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Compra: { icon: ArrowUpCircle, color: 'text-gain', bg: 'bg-gain-muted' },
  Venta: { icon: ArrowDownCircle, color: 'text-loss', bg: 'bg-loss-muted' },
  Dividendo: { icon: DollarSign, color: 'text-blue-accent', bg: 'bg-blue-muted' },
  Comisión: { icon: MinusCircle, color: 'text-muted-foreground', bg: 'bg-surface-3' },
  Ingreso: { icon: ArrowDownToLine, color: 'text-gain', bg: 'bg-gain-muted' },
  Retirada: { icon: ArrowUpFromLine, color: 'text-loss', bg: 'bg-loss-muted' },
}

export function TransaccionesCard() {
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [search, setSearch] = useState('')

  const filtered = transactions.filter((t) => {
    const matchType = activeFilter === 'Todas' || t.type === activeFilter
    const matchSearch = !search || t.asset.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div className="bg-surface-1 border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Transacciones recientes</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Nueva transacción
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 flex-wrap">
          {typeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                activeFilter === f
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-3/60'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-surface-2 border border-border/40 rounded-xl px-2.5 py-1.5 sm:ml-auto">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar activo…"
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-28"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-2.5 pl-1 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Activo</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Tipo</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Cantidad</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Precio</th>
              <th className="text-right pb-2.5 pr-1 text-muted-foreground font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 8).map((t, i) => {
              const cfg = typeConfig[t.type] ?? typeConfig['Comisión']
              const Icon = cfg.icon
              return (
                <tr
                  key={t.id}
                  className={cn(
                    'group transition-colors hover:bg-surface-2/60',
                    i < filtered.length - 1 && 'border-b border-border/20'
                  )}
                >
                  <td className="py-2.5 pl-1 text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2.5">
                    <div>
                      <span className="font-semibold text-foreground">{t.asset}</span>
                      <span className="text-muted-foreground ml-1.5 hidden sm:inline">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium', cfg.bg, cfg.color)}>
                      <Icon className="w-3 h-3" />
                      {t.type}
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{t.quantity}</td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {t.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="py-2.5 text-right pr-1 font-semibold text-foreground">
                    {t.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
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
