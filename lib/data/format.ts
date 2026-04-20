import type { TransactionType } from '@/lib/supabase/types'

export const transactionTypeLabel: Record<TransactionType, string> = {
  buy: 'Compra',
  sell: 'Venta',
  transfer_in: 'Traspaso entrada',
  transfer_out: 'Traspaso salida',
  switch_in: 'Switch entrada',
  switch_out: 'Switch salida',
}

export function formatCurrency(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits,
  })
}

export function formatPercent(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return 'N/D'
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`
}

export function fundInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'FI'
}

export function normalizeIsin(isin: string) {
  return isin.trim().toUpperCase()
}
