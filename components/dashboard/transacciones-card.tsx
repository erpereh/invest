'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Account, Fund, RecentTransaction, TransactionType } from '@/lib/supabase/types'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'
import { formatCurrency, transactionTypeLabel } from '@/lib/data/format'

const typeFilters = ['Todas', ...Object.values(transactionTypeLabel)]

const typeConfig: Record<TransactionType, { icon: React.ElementType; color: string; bg: string }> = {
  buy: { icon: ArrowUpCircle, color: 'text-gain', bg: 'bg-gain-muted' },
  sell: { icon: ArrowDownCircle, color: 'text-loss', bg: 'bg-loss-muted' },
  transfer_in: { icon: ArrowDownToLine, color: 'text-gain', bg: 'bg-gain-muted' },
  transfer_out: { icon: ArrowUpFromLine, color: 'text-loss', bg: 'bg-loss-muted' },
  switch_in: { icon: RefreshCw, color: 'text-blue-accent', bg: 'bg-blue-muted' },
  switch_out: { icon: RefreshCw, color: 'text-muted-foreground', bg: 'bg-surface-3' },
}

interface TransaccionesCardProps {
  transactions: RecentTransaction[]
  funds: Fund[]
  accounts: Account[]
  diagnostics?: PortfolioDashboardData['diagnostics']
}

export function TransaccionesCard({ transactions, funds, accounts, diagnostics }: TransaccionesCardProps) {
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const filtered = useMemo(() => transactions.filter((transaction) => {
    const label = transactionTypeLabel[transaction.transaction_type]
    const matchType = activeFilter === 'Todas' || label === activeFilter
    const haystack = `${transaction.isin} ${transaction.fund_name}`.toLowerCase()
    const matchSearch = !search || haystack.includes(search.toLowerCase())
    return matchType && matchSearch
  }), [activeFilter, search, transactions])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('Guardando movimiento...')
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (!response.ok || !result.ok) {
      setStatus(result.error ?? 'No se pudo guardar.')
      return
    }
    setStatus('Movimiento guardado. Recargando datos...')
    window.location.reload()
  }

  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Movimientos recientes</p>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva transaccion
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-surface-2/60 rounded-xl border border-border/40">
          <select name="account_id" required className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs">
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
          <select name="fund_id" required className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs">
            {funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.isin} - {fund.name}</option>)}
          </select>
          <select name="transaction_type" required className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs">
            {Object.entries(transactionTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input name="trade_date" required type="date" className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs" />
          <input name="amount_eur" required type="number" step="0.000001" min="0" placeholder="Importe EUR" className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs" />
          <input name="shares" required type="number" step="0.0000000001" min="0" placeholder="Participaciones" className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs" />
          <input name="nav_used" type="number" step="0.00000001" min="0" placeholder="NAV usado" className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs" />
          <input name="fee_amount" type="number" step="0.000001" min="0" placeholder="Comision" className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs" />
          <input name="source" defaultValue="manual" className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs" />
          <input name="notes" placeholder="Notas" className="sm:col-span-2 bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs" />
          <button className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-semibold">Guardar</button>
          {status ? <p className="lg:col-span-4 text-xs text-muted-foreground">{status}</p> : null}
        </form>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 flex-wrap">
          {typeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-[background-color,color,box-shadow] duration-150 ease-out', activeFilter === filter ? 'bg-primary/18 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-3/75')}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-surface-2 border border-border/40 rounded-xl px-2.5 py-1.5 sm:ml-auto">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ISIN..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-28" />
        </div>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[680px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-2.5 pl-1 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Fondo</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Tipo</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Particip.</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">NAV</th>
              <th className="text-right pb-2.5 pr-1 text-muted-foreground font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.slice(0, 12).map((transaction, index) => {
              const cfg = typeConfig[transaction.transaction_type]
              const Icon = cfg.icon
              return (
                <tr key={transaction.id} className={cn('group transition-colors duration-150 ease-out hover:bg-surface-2/70', index < filtered.length - 1 && 'border-b border-border/20')}>
                  <td className="py-2.5 pl-1 text-muted-foreground whitespace-nowrap">{new Date(transaction.trade_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-2.5">
                    <div>
                      <span className="font-semibold text-foreground">{transaction.isin}</span>
                      <span className="text-muted-foreground ml-1.5 hidden sm:inline">{transaction.fund_name}</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium', cfg.bg, cfg.color)}>
                      <Icon className="w-3 h-3" />
                      {transactionTypeLabel[transaction.transaction_type]}
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{Number(transaction.shares).toFixed(4)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{transaction.nav_used ? formatCurrency(Number(transaction.nav_used), 4) : 'N/D'}</td>
                  <td className="py-2.5 text-right pr-1 font-semibold text-foreground">{formatCurrency(Number(transaction.amount_eur), 2)}</td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  {diagnostics?.validImportRows
                    ? 'Hay filas validas en staging pendientes de aceptar.'
                    : diagnostics?.invalidImportRows
                      ? 'Hay imports en staging con errores de validacion.'
                      : 'No hay movimientos reales todavia.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
