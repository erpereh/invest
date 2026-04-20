import { maybeCreateServiceSupabaseClient } from '@/lib/supabase/server'
import type {
  Account,
  CurrentHolding,
  Fund,
  ImportJob,
  LatestFundNav,
  PortfolioDistribution,
  PortfolioSummary,
  RecentTransaction,
} from '@/lib/supabase/types'

export interface PortfolioEvolutionPoint {
  date: string
  value: number
  invested: number
  pnl: number
  pnlPct: number | null
}

export interface DistributionSlice {
  name: string
  value: number
  marketValue: number
}

export interface PortfolioDashboardData {
  configured: boolean
  error?: string
  summary: PortfolioSummary
  distribution: PortfolioDistribution[]
  holdings: CurrentHolding[]
  recentTransactions: RecentTransaction[]
  latestNavs: LatestFundNav[]
  evolution: PortfolioEvolutionPoint[]
  funds: Fund[]
  accounts: Account[]
  imports: ImportJob[]
  groupedDistribution: {
    funds: DistributionSlice[]
    regions: DistributionSlice[]
    categories: DistributionSlice[]
    managers: DistributionSlice[]
  }
}

const emptySummary: PortfolioSummary = {
  total_market_value: 0,
  total_invested_amount: 0,
  total_pnl_eur: 0,
  total_pnl_pct: null,
  positions_count: 0,
  latest_holding_date: null,
}

export function getEmptyDashboardData(error?: string): PortfolioDashboardData {
  return {
    configured: !error,
    error,
    summary: emptySummary,
    distribution: [],
    holdings: [],
    recentTransactions: [],
    latestNavs: [],
    evolution: [],
    funds: [],
    accounts: [],
    imports: [],
    groupedDistribution: {
      funds: [],
      regions: [],
      categories: [],
      managers: [],
    },
  }
}

export async function getPortfolioDashboardData(): Promise<PortfolioDashboardData> {
  const supabase = maybeCreateServiceSupabaseClient()
  if (!supabase) {
    return getEmptyDashboardData('Faltan variables de entorno de Supabase en el servidor.')
  }

  const [
    summaryResult,
    distributionResult,
    holdingsResult,
    transactionsResult,
    navsResult,
    evolutionResult,
    fundsResult,
    accountsResult,
    importsResult,
  ] = await Promise.all([
    supabase.from('portfolio_summary').select('*').maybeSingle(),
    supabase.from('portfolio_distribution').select('*').order('portfolio_weight_pct', { ascending: false }),
    supabase.from('current_holdings').select('*').order('market_value', { ascending: false }),
    supabase.from('recent_transactions').select('*').limit(50),
    supabase.from('latest_fund_nav').select('*').order('name'),
    supabase.from('holdings_daily').select('holding_date, market_value, invested_amount, pnl_eur').order('holding_date'),
    supabase.from('funds').select('*').order('name'),
    supabase.from('accounts').select('*').order('name'),
    supabase.from('imports').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  const firstError =
    summaryResult.error ??
    distributionResult.error ??
    holdingsResult.error ??
    transactionsResult.error ??
    navsResult.error ??
    evolutionResult.error ??
    fundsResult.error ??
    accountsResult.error ??
    importsResult.error

  if (firstError) {
    return getEmptyDashboardData(firstError.message)
  }

  const holdings = holdingsResult.data ?? []
  const distribution = distributionResult.data ?? []

  return {
    configured: true,
    summary: summaryResult.data ?? emptySummary,
    distribution,
    holdings,
    recentTransactions: transactionsResult.data ?? [],
    latestNavs: navsResult.data ?? [],
    evolution: buildEvolution(evolutionResult.data ?? []),
    funds: fundsResult.data ?? [],
    accounts: accountsResult.data ?? [],
    imports: importsResult.data ?? [],
    groupedDistribution: {
      funds: distribution.map((item) => ({
        name: item.isin,
        value: Number(item.portfolio_weight_pct ?? 0),
        marketValue: Number(item.market_value ?? 0),
      })),
      regions: groupHoldings(holdings, (item) => item.region || 'Sin region'),
      categories: groupHoldings(holdings, (item) => item.category || 'Sin categoria'),
      managers: groupHoldings(holdings, (item) => item.management_company || 'Sin gestora'),
    },
  }
}

function buildEvolution(rows: { holding_date: string; market_value: number; invested_amount: number; pnl_eur: number }[]) {
  const byDate = new Map<string, { value: number; invested: number; pnl: number }>()

  for (const row of rows) {
    const current = byDate.get(row.holding_date) ?? { value: 0, invested: 0, pnl: 0 }
    current.value += Number(row.market_value ?? 0)
    current.invested += Number(row.invested_amount ?? 0)
    current.pnl += Number(row.pnl_eur ?? 0)
    byDate.set(row.holding_date, current)
  }

  return Array.from(byDate.entries()).map(([date, values]) => ({
    date,
    value: values.value,
    invested: values.invested,
    pnl: values.pnl,
    pnlPct: values.invested > 0 ? (values.pnl / values.invested) * 100 : null,
  }))
}

function groupHoldings(holdings: CurrentHolding[], getKey: (item: CurrentHolding) => string): DistributionSlice[] {
  const total = holdings.reduce((acc, item) => acc + Number(item.market_value ?? 0), 0)
  const grouped = new Map<string, number>()

  for (const item of holdings) {
    const key = getKey(item)
    grouped.set(key, (grouped.get(key) ?? 0) + Number(item.market_value ?? 0))
  }

  return Array.from(grouped.entries())
    .map(([name, marketValue]) => ({
      name,
      marketValue,
      value: total > 0 ? (marketValue / total) * 100 : 0,
    }))
    .sort((a, b) => b.marketValue - a.marketValue)
}
