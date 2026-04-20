import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { FundNav, Transaction } from '@/lib/supabase/types'

const inTypes = new Set(['buy', 'transfer_in', 'switch_in'])

interface PositionState {
  accountId: string
  fundId: string
  shares: number
  investedAmount: number
}

export async function recalculateHoldings() {
  const supabase = createServiceSupabaseClient()
  const [{ data: transactions, error: txError }, { data: navs, error: navError }] = await Promise.all([
    supabase.from('transactions').select('*').order('trade_date').order('created_at'),
    supabase.from('fund_navs').select('*').order('nav_date'),
  ])

  if (txError) throw new Error(txError.message)
  if (navError) throw new Error(navError.message)

  await supabase.from('holdings_daily').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const txs = transactions ?? []
  const navRows = navs ?? []
  if (txs.length === 0 || navRows.length === 0) {
    return { snapshots: 0, note: 'No hay transacciones o NAVs suficientes para recalcular holdings.' }
  }

  const navsByFund = groupNavsByFund(navRows)
  const states = new Map<string, PositionState>()
  const snapshots = []

  for (const tx of txs) {
    const key = `${tx.account_id}:${tx.fund_id}`
    const state = states.get(key) ?? {
      accountId: tx.account_id,
      fundId: tx.fund_id,
      shares: 0,
      investedAmount: 0,
    }

    applyTransaction(state, tx)
    states.set(key, state)

    const nav = findNavForDate(navsByFund.get(tx.fund_id) ?? [], tx.trade_date)
    if (!nav || state.shares <= 0) continue

    const marketValue = state.shares * Number(nav.nav)
    const avgCost = state.shares > 0 ? state.investedAmount / state.shares : 0
    const pnl = marketValue - state.investedAmount

    snapshots.push({
      account_id: state.accountId,
      fund_id: state.fundId,
      holding_date: tx.trade_date,
      shares: round(state.shares, 10),
      avg_cost: round(avgCost, 8),
      invested_amount: round(state.investedAmount, 6),
      nav: Number(nav.nav),
      market_value: round(marketValue, 6),
      pnl_eur: round(pnl, 6),
      pnl_pct: state.investedAmount > 0 ? round((pnl / state.investedAmount) * 100, 8) : null,
    })
  }

  if (snapshots.length > 0) {
    const { error } = await supabase
      .from('holdings_daily')
      .upsert(snapshots, { onConflict: 'account_id,fund_id,holding_date' })
    if (error) throw new Error(error.message)
  }

  return { snapshots: snapshots.length }
}

function applyTransaction(state: PositionState, tx: Transaction) {
  const shares = Number(tx.shares)
  const amount = Number(tx.amount_eur)

  if (inTypes.has(tx.transaction_type)) {
    state.shares += shares
    state.investedAmount += amount + Number(tx.fee_amount ?? 0)
    return
  }

  const currentShares = state.shares
  if (currentShares <= 0) return

  const removedRatio = Math.min(shares / currentShares, 1)
  state.shares = Math.max(0, currentShares - shares)
  state.investedAmount = Math.max(0, state.investedAmount * (1 - removedRatio))
}

function groupNavsByFund(navs: FundNav[]) {
  const byFund = new Map<string, FundNav[]>()
  for (const nav of navs) {
    const current = byFund.get(nav.fund_id) ?? []
    current.push(nav)
    byFund.set(nav.fund_id, current)
  }
  return byFund
}

function findNavForDate(navs: FundNav[], date: string) {
  let selected: FundNav | null = null
  for (const nav of navs) {
    if (nav.nav_date <= date) selected = nav
  }
  return selected ?? navs.at(-1) ?? null
}

function round(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
