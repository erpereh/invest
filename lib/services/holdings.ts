import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { FundNav, Transaction } from '@/lib/supabase/types'

const inTypes = new Set(['buy', 'transfer_in', 'switch_in'])
const outTypes = new Set(['sell', 'transfer_out', 'switch_out'])
const chunkSize = 500

interface PositionState {
  accountId: string
  fundId: string
  shares: number
  investedAmount: number
}

interface HoldingSnapshot {
  account_id: string
  fund_id: string
  holding_date: string
  shares: number
  avg_cost: number
  invested_amount: number
  nav: number
  market_value: number
  pnl_eur: number
  pnl_pct: number | null
}

export async function recalculateHoldings() {
  const supabase = createServiceSupabaseClient()
  const [{ data: transactions, error: txError }, { data: navs, error: navError }] = await Promise.all([
    supabase.from('transactions').select('*').order('trade_date').order('created_at'),
    supabase.from('fund_navs').select('*').order('nav_date'),
  ])

  if (txError) throw new Error(txError.message)
  if (navError) throw new Error(navError.message)

  const txs = transactions ?? []
  const navRows = navs ?? []

  console.info('[holdings] recalculation started', { transactions: txs.length, navs: navRows.length })

  await supabase.from('holdings_daily').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (txs.length === 0 || navRows.length === 0) {
    const note = 'No hay transacciones o NAVs suficientes para recalcular holdings.'
    console.info('[holdings] recalculation skipped', { note, transactions: txs.length, navs: navRows.length })
    return { snapshots: 0, transactions: txs.length, navs: navRows.length, note }
  }

  const navsByFund = groupNavsByFund(navRows)
  const txsByDate = groupTransactionsByDate(txs)
  const dates = buildSnapshotDates(txs, navRows)
  const states = new Map<string, PositionState>()
  const snapshots: HoldingSnapshot[] = []
  let skippedNoNav = 0
  let skippedZeroShares = 0

  for (const date of dates) {
    for (const tx of txsByDate.get(date) ?? []) {
      const key = `${tx.account_id}:${tx.fund_id}`
      const state = states.get(key) ?? {
        accountId: tx.account_id,
        fundId: tx.fund_id,
        shares: 0,
        investedAmount: 0,
      }

      applyTransaction(state, tx)
      states.set(key, state)
    }

    for (const state of states.values()) {
      if (state.shares <= 0) {
        skippedZeroShares += 1
        continue
      }

      const nav = findNavForDate(navsByFund.get(state.fundId) ?? [], date)
      if (!nav) {
        skippedNoNav += 1
        continue
      }

      snapshots.push(buildSnapshot(state, nav, date))
    }
  }

  for (let index = 0; index < snapshots.length; index += chunkSize) {
    const chunk = snapshots.slice(index, index + chunkSize)
    const { error } = await supabase.from('holdings_daily').upsert(chunk, { onConflict: 'account_id,fund_id,holding_date' })
    if (error) {
      console.error('[holdings] snapshot upsert failed', { error: error.message, chunk: index / chunkSize })
      throw new Error(error.message)
    }
  }

  const result = {
    snapshots: snapshots.length,
    transactions: txs.length,
    navs: navRows.length,
    dates: dates.length,
    skippedNoNav,
    skippedZeroShares,
  }
  console.info('[holdings] recalculation finished', result)
  return result
}

function applyTransaction(state: PositionState, tx: Transaction) {
  const shares = Number(tx.shares)
  const amount = Number(tx.amount_eur)

  if (!Number.isFinite(shares) || !Number.isFinite(amount) || shares <= 0) return

  if (inTypes.has(tx.transaction_type)) {
    state.shares += shares
    state.investedAmount += amount + Number(tx.fee_amount ?? 0)
    return
  }

  if (!outTypes.has(tx.transaction_type)) return

  const currentShares = state.shares
  if (currentShares <= 0) return

  const removedRatio = Math.min(shares / currentShares, 1)
  state.shares = round(Math.max(0, currentShares - shares), 10)
  state.investedAmount = round(Math.max(0, state.investedAmount * (1 - removedRatio)), 6)
}

function buildSnapshot(state: PositionState, nav: FundNav, date: string): HoldingSnapshot {
  const marketValue = state.shares * Number(nav.nav)
  const avgCost = state.shares > 0 ? state.investedAmount / state.shares : 0
  const pnl = marketValue - state.investedAmount

  return {
    account_id: state.accountId,
    fund_id: state.fundId,
    holding_date: date,
    shares: round(state.shares, 10),
    avg_cost: round(avgCost, 8),
    invested_amount: round(state.investedAmount, 6),
    nav: Number(nav.nav),
    market_value: round(marketValue, 6),
    pnl_eur: round(pnl, 6),
    pnl_pct: state.investedAmount > 0 ? round((pnl / state.investedAmount) * 100, 8) : null,
  }
}

function groupTransactionsByDate(transactions: Transaction[]) {
  const byDate = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    byDate.set(tx.trade_date, [...(byDate.get(tx.trade_date) ?? []), tx])
  }
  return byDate
}

function buildSnapshotDates(transactions: Transaction[], navs: FundNav[]) {
  const firstTransactionDate = transactions[0]?.trade_date
  const dates = new Set<string>()
  for (const tx of transactions) dates.add(tx.trade_date)
  for (const nav of navs) {
    if (!firstTransactionDate || nav.nav_date >= firstTransactionDate) dates.add(nav.nav_date)
  }
  return Array.from(dates).sort()
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
    if (nav.nav_date > date) break
  }
  return selected
}

function round(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
