import { z } from 'zod'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { TransactionType } from '@/lib/supabase/types'
import { recalculateHoldings } from '@/lib/services/holdings'

export const transactionSchema = z.object({
  account_id: z.string().uuid(),
  fund_id: z.string().uuid(),
  transaction_type: z.enum(['buy', 'sell', 'transfer_in', 'transfer_out', 'switch_in', 'switch_out']),
  trade_date: z.string().min(10),
  settlement_date: z.string().min(10).nullable().optional(),
  amount_eur: z.coerce.number().min(0),
  nav_used: z.coerce.number().positive().nullable().optional(),
  shares: z.coerce.number().positive(),
  fee_amount: z.coerce.number().min(0).nullable().optional(),
  source: z.string().min(1).default('manual'),
  notes: z.string().nullable().optional(),
  raw_import_id: z.string().uuid().nullable().optional(),
})

export interface CreateTransactionInput {
  account_id: string
  fund_id: string
  transaction_type: TransactionType
  trade_date: string
  settlement_date?: string | null
  amount_eur: number
  nav_used?: number | null
  shares: number
  fee_amount?: number | null
  source?: string
  notes?: string | null
  raw_import_id?: string | null
}

export async function createTransaction(input: CreateTransactionInput) {
  const payload = transactionSchema.parse(input)
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.from('transactions').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  await recalculateHoldings()
  return data
}

export async function deleteTransaction(transactionId: string) {
  const id = z.string().uuid().parse(transactionId)
  const supabase = createServiceSupabaseClient()

  console.info('[transactions] delete requested', { transactionId: id })

  const { data: existing, error: lookupError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (lookupError || !existing) {
    console.warn('[transactions] delete failed: transaction not found', {
      transactionId: id,
      error: lookupError?.message,
    })
    throw new Error('No se encontro el movimiento para eliminar.')
  }

  const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id)
  if (deleteError) {
    console.error('[transactions] delete failed', { transactionId: id, error: deleteError.message })
    throw new Error(deleteError.message)
  }

  const recalculation = await recalculateHoldings()
  console.info('[transactions] delete completed', {
    transactionId: id,
    fundId: existing.fund_id,
    accountId: existing.account_id,
    tradeDate: existing.trade_date,
    recalculation,
  })

  return { deletedTransactionId: id, transaction: existing, recalculation }
}

export async function listTransactions() {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.from('recent_transactions').select('*').limit(100)
  if (error) throw new Error(error.message)
  return data ?? []
}
