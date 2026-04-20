import { maybeCreateServiceSupabaseClient } from '@/lib/supabase/server'
import type {
  Account,
  CurrentHolding,
  Fund,
  ImportJob,
  ImportRow,
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
  key: string
  name: string
  detail?: string
  rawValue?: string
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
  importRows: ImportRow[]
  diagnostics: {
    transactionCount: number
    holdingsDailyCount: number
    invalidImportRows: number
    validImportRows: number
  }
  groupedDistribution: {
    totalMarketValue: number
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
    importRows: [],
    diagnostics: {
      transactionCount: 0,
      holdingsDailyCount: 0,
      invalidImportRows: 0,
      validImportRows: 0,
    },
    groupedDistribution: {
      totalMarketValue: 0,
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
    importRowsResult,
    transactionsCountResult,
    holdingsCountResult,
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
    supabase.from('import_rows').select('*').order('created_at', { ascending: false }).limit(80),
    supabase.from('transactions').select('id', { count: 'exact', head: true }),
    supabase.from('holdings_daily').select('id', { count: 'exact', head: true }),
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
    importsResult.error ??
    importRowsResult.error ??
    transactionsCountResult.error ??
    holdingsCountResult.error

  if (firstError) {
    return getEmptyDashboardData(firstError.message)
  }

  const holdings = holdingsResult.data ?? []
  const distribution = distributionResult.data ?? []
  const importRows = importRowsResult.data ?? []
  const groupedDistribution = buildGroupedDistribution(holdings)

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
    importRows,
    diagnostics: {
      transactionCount: transactionsCountResult.count ?? transactionsResult.data?.length ?? 0,
      holdingsDailyCount: holdingsCountResult.count ?? evolutionResult.data?.length ?? 0,
      invalidImportRows: importRows.filter((row) => row.validation_status === 'invalid' || row.validation_status === 'rejected').length,
      validImportRows: importRows.filter((row) => row.validation_status === 'valid').length,
    },
    groupedDistribution,
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

function buildGroupedDistribution(holdings: CurrentHolding[]): PortfolioDashboardData['groupedDistribution'] {
  const valuedHoldings = holdings.filter((item) => {
    const shares = Number(item.shares ?? 0)
    const marketValue = Number(item.market_value ?? 0)
    return Number.isFinite(shares) && Number.isFinite(marketValue) && shares > 0 && marketValue > 0
  })

  const totalMarketValue = valuedHoldings.reduce((acc, item) => acc + Number(item.market_value ?? 0), 0)

  return {
    totalMarketValue,
    funds: groupDistributionByFund(valuedHoldings, totalMarketValue),
    regions: groupDistributionByRegion(valuedHoldings, totalMarketValue),
    categories: groupDistributionByCategory(valuedHoldings, totalMarketValue),
    managers: groupDistributionByManager(valuedHoldings, totalMarketValue),
  }
}

function groupDistributionByFund(holdings: CurrentHolding[], total: number): DistributionSlice[] {
  return groupHoldings(holdings, total, (item) => ({
    key: item.fund_id,
    name: item.fund_name,
    detail: item.isin,
    rawValue: item.fund_id,
  }))
}

function groupDistributionByRegion(holdings: CurrentHolding[], total: number): DistributionSlice[] {
  return groupHoldings(holdings, total, (item) => {
    const rawValue = normalizeGroupValue(item.region, 'Sin region')
    return {
      key: `region:${rawValue}`,
      name: formatRegionLabel(rawValue),
      rawValue,
    }
  })
}

function groupDistributionByCategory(holdings: CurrentHolding[], total: number): DistributionSlice[] {
  return groupHoldings(holdings, total, (item) => {
    const rawValue = normalizeGroupValue(item.category, 'Sin categoria')
    return {
      key: `category:${rawValue}`,
      name: formatCategoryLabel(rawValue),
      rawValue,
    }
  })
}

function groupDistributionByManager(holdings: CurrentHolding[], total: number): DistributionSlice[] {
  return groupHoldings(holdings, total, (item) => {
    const rawValue = normalizeGroupValue(item.management_company, 'Sin gestora')
    return {
      key: `manager:${rawValue}`,
      name: rawValue,
      rawValue,
    }
  })
}

function groupHoldings(
  holdings: CurrentHolding[],
  total: number,
  getGroup: (item: CurrentHolding) => { key: string; name: string; detail?: string; rawValue?: string },
): DistributionSlice[] {
  const grouped = new Map<string, { name: string; detail?: string; rawValue?: string; marketValue: number }>()

  for (const item of holdings) {
    const group = getGroup(item)
    const current = grouped.get(group.key) ?? { name: group.name, detail: group.detail, rawValue: group.rawValue, marketValue: 0 }
    current.marketValue += Number(item.market_value ?? 0)
    current.detail = current.detail ?? group.detail
    current.rawValue = current.rawValue ?? group.rawValue
    grouped.set(group.key, current)
  }

  return Array.from(grouped.entries())
    .map(([key, item]) => ({
      key,
      name: item.name,
      detail: item.detail,
      rawValue: item.rawValue,
      marketValue: item.marketValue,
      value: total > 0 ? (item.marketValue / total) * 100 : 0,
    }))
    .sort((a, b) => b.marketValue - a.marketValue)
}

function normalizeGroupValue(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim()
  return normalized || fallback
}

function formatRegionLabel(region: string) {
  const labels: Record<string, string> = {
    developed_world: 'Mercados desarrollados',
    emerging_markets: 'Mercados emergentes',
    global: 'Global',
    'Sin region': 'Sin region',
  }

  return labels[region] ?? formatRawLabel(region)
}

function formatCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    global_developed_index: 'Indice global desarrollado',
    emerging_markets_index: 'Indice mercados emergentes',
    global_small_cap_index: 'Indice global small cap',
    'Sin categoria': 'Sin categoria',
  }

  return labels[category] ?? formatRawLabel(category)
}

function formatRawLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
