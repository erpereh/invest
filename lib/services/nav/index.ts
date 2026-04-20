import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { recalculateHoldings } from '@/lib/services/holdings'
import type { Fund, FundNav, Json } from '@/lib/supabase/types'
import type {
  FundMetadataResult,
  MetadataJson,
  NavProvider,
  NavProviderAttempt,
  NavQuote,
  NavRefreshFundResult,
  NavRefreshResult,
} from '@/lib/services/nav/types'
import { blackrockProvider } from '@/lib/services/nav/providers/blackrock'
import { fallbackProvider } from '@/lib/services/nav/providers/fallback'
import { vanguardProvider } from '@/lib/services/nav/providers/vanguard'
import { NavProviderError, sanitizeError, subtractDays, uniqueQuotesByDate } from '@/lib/services/nav/utils'

const primaryProviders: Record<string, NavProvider> = {
  IE000ZYRH0Q7: blackrockProvider,
  IE000QAZP7L2: blackrockProvider,
  IE00B42W3S00: vanguardProvider,
}

export async function fetchFundMetadataByIsin(isin: string) {
  return runProviderChain(normalizeIsin(isin), (provider, normalized) => provider.fetchMetadataByIsin(normalized))
}

export async function fetchLatestNavByIsin(isin: string) {
  return runProviderChain(normalizeIsin(isin), (provider, normalized) => provider.fetchLatestNavByIsin(normalized))
}

export async function fetchHistoricalNavsByIsin(isin: string, fromDate?: string) {
  return runProviderChain(normalizeIsin(isin), (provider, normalized) => provider.fetchHistoricalNavsByIsin(normalized, fromDate))
}

export async function refreshNavs(): Promise<NavRefreshResult> {
  const supabase = createServiceSupabaseClient()
  const [{ data: funds, error }, { data: transactions, error: txError }] = await Promise.all([
    supabase.from('funds').select('*').eq('active', true).order('name'),
    supabase.from('transactions').select('fund_id, trade_date').order('trade_date'),
  ])

  if (error) throw new Error(error.message)
  if (txError) throw new Error(txError.message)

  const earliestTradeByFund = new Map<string, string>()
  for (const tx of transactions ?? []) {
    const current = earliestTradeByFund.get(tx.fund_id)
    if (!current || tx.trade_date < current) earliestTradeByFund.set(tx.fund_id, tx.trade_date)
  }

  const results: NavRefreshFundResult[] = []
  let changedRows = 0

  for (const fund of funds ?? []) {
    const result = await refreshFundNavs(fund, earliestTradeByFund.get(fund.id))
    results.push(result)
    changedRows += result.changedRows
  }

  const recalculation = changedRows > 0 ? await recalculateHoldings() : null
  const missing = results.filter((result) => result.status !== 'success').map((result) => result.isin)

  return {
    refreshed: results.filter((result) => result.status === 'success').length,
    changedRows,
    missing,
    funds: results,
    recalculation,
    note: results.length === 0 ? 'No hay fondos activos para refrescar.' : undefined,
  }
}

async function refreshFundNavs(fund: Fund, earliestTradeDate?: string): Promise<NavRefreshFundResult> {
  const fromDate = earliestTradeDate ? subtractDays(new Date(`${earliestTradeDate}T00:00:00.000Z`), 7) : subtractDays(new Date(), 90)
  const attempts: NavProviderAttempt[] = []
  let provider: string | null = null
  let sourceUrl: string | undefined

  try {
    const metadataResult = await runProviderChain(fund.isin, async (currentProvider, normalized) => {
      const startedUrl = currentProvider.getSourceUrl(normalized)
      try {
        const metadata = await currentProvider.fetchMetadataByIsin(normalized)
        return metadata
      } catch (error) {
        throw normalizeProviderError(error, currentProvider.name, startedUrl)
      }
    })

    const navResult = await runProviderChainWithAttempts(
      fund.isin,
      attempts,
      (currentProvider, normalized) => currentProvider.fetchHistoricalNavsByIsin(normalized, fromDate)
    )

    const quotes = uniqueQuotesByDate(navResult.value)
    provider = navResult.provider.name
    sourceUrl = navResult.provider.getSourceUrl(fund.isin)

    const changed = quotes.length > 0 ? await upsertQuotes(fund.id, quotes) : 0
    await updateFundMetadata(fund, metadataResult.sourceStatus === 'unsupported' ? null : metadataResult, {
      provider,
      sourceUrl,
      status: 'success',
      rows: quotes.length,
    })

    console.info('[nav-refresh] fund refreshed', {
      isin: fund.isin,
      provider,
      sourceUrl,
      rows: quotes.length,
      changed,
    })

    return {
      fundId: fund.id,
      isin: fund.isin,
      provider,
      status: 'success',
      sourceUrl,
      importedRows: quotes.length,
      changedRows: changed,
      attempts,
    }
  } catch (error) {
    const message = sanitizeError(error instanceof Error ? error.message : 'Error desconocido al refrescar NAV.')
    await updateFundMetadata(fund, null, {
      provider,
      sourceUrl,
      status: 'failed',
      rows: 0,
      error: message,
    })

    console.warn('[nav-refresh] fund failed', {
      isin: fund.isin,
      provider,
      sourceUrl,
      error: message,
      attempts,
    })

    return {
      fundId: fund.id,
      isin: fund.isin,
      provider,
      status: 'failed',
      sourceUrl,
      importedRows: 0,
      changedRows: 0,
      attempts,
      error: message,
    }
  }
}

async function upsertQuotes(fundId: string, quotes: NavQuote[]) {
  const supabase = createServiceSupabaseClient()
  const dates = quotes.map((quote) => quote.navDate)
  const { data: existingRows, error: existingError } = await supabase
    .from('fund_navs')
    .select('*')
    .eq('fund_id', fundId)
    .in('nav_date', dates)

  if (existingError) throw new Error(existingError.message)

  const existingByDate = new Map((existingRows ?? []).map((row: FundNav) => [row.nav_date, row]))
  const changedRows = quotes.filter((quote) => {
    const existing = existingByDate.get(quote.navDate)
    return !existing || Number(existing.nav) !== quote.nav || existing.currency !== quote.currency || existing.source !== quote.source
  }).length

  const { error } = await supabase.from('fund_navs').upsert(
    quotes.map((quote) => ({
      fund_id: fundId,
      nav_date: quote.navDate,
      nav: quote.nav,
      currency: quote.currency,
      source: quote.source,
      raw_payload: {
        ...quote.rawPayload,
        source_url: quote.sourceUrl,
      },
    })),
    { onConflict: 'fund_id,nav_date' }
  )

  if (error) throw new Error(error.message)
  return changedRows
}

async function updateFundMetadata(
  fund: Fund,
  metadata: FundMetadataResult | null,
  status: {
    provider: string | null
    sourceUrl?: string
    status: 'success' | 'failed'
    rows: number
    error?: string
  }
) {
  const supabase = createServiceSupabaseClient()
  const current = isRecord(fund.metadata) ? fund.metadata : {}
  const next: MetadataJson = {
    ...current,
    nav_provider: status.provider ?? current.nav_provider,
    nav_source_url: status.sourceUrl ?? current.nav_source_url,
    nav_last_refresh_at: new Date().toISOString(),
    nav_last_status: status.status,
    nav_rows_imported: status.rows,
    nav_last_error: status.error ?? null,
  }

  if (status.status === 'success') next.nav_last_success_at = new Date().toISOString()
  if (metadata) {
    next.nav_metadata_provider = metadata.provider
    next.nav_official_url = metadata.officialUrl
    next.nav_metadata_raw = metadata.rawPayload as Json
  }

  const updates: Partial<Fund> = { metadata: next as Json }
  if (metadata?.name) updates.name = metadata.name
  if (metadata?.managementCompany) updates.management_company = metadata.managementCompany
  if (metadata?.currency) updates.currency = metadata.currency
  if (metadata?.region) updates.region = metadata.region
  if (metadata?.category) updates.category = metadata.category

  const { error } = await supabase.from('funds').update(updates).eq('id', fund.id)
  if (error) throw new Error(error.message)
}

async function runProviderChain<T>(isin: string, action: (provider: NavProvider, normalized: string) => Promise<T>) {
  const result = await runProviderChainWithAttempts(isin, [], action)
  return result.value
}

async function runProviderChainWithAttempts<T>(
  isin: string,
  attempts: NavProviderAttempt[],
  action: (provider: NavProvider, normalized: string) => Promise<T>
) {
  const normalized = normalizeIsin(isin)
  const providers = getProvidersForIsin(normalized)
  let lastError: Error | null = null

  for (const provider of providers) {
    const sourceUrl = provider.getSourceUrl(normalized)
    try {
      console.info('[nav-provider] attempt', { isin: normalized, provider: provider.name, sourceUrl })
      const value = await action(provider, normalized)
      const rows = Array.isArray(value) ? value.length : 1
      attempts.push({ provider: provider.name, sourceUrl, ok: true, rows })
      console.info('[nav-provider] success', { isin: normalized, provider: provider.name, sourceUrl, rows })
      return { value, provider }
    } catch (error) {
      const providerError = normalizeProviderError(error, provider.name, sourceUrl)
      lastError = providerError
      attempts.push({
        provider: provider.name,
        sourceUrl,
        ok: false,
        rows: 0,
        error: sanitizeError(providerError.message),
      })
      console.warn('[nav-provider] failed', {
        isin: normalized,
        provider: provider.name,
        sourceUrl,
        error: sanitizeError(providerError.message),
      })
    }
  }

  throw lastError ?? new NavProviderError('nav', `No hay proveedores NAV configurados para ${normalized}.`)
}

function getProvidersForIsin(isin: string): NavProvider[] {
  const primary = primaryProviders[isin]
  return primary ? [primary, fallbackProvider] : [fallbackProvider]
}

function normalizeProviderError(error: unknown, provider: string, sourceUrl?: string) {
  if (error instanceof NavProviderError) return error
  const message = error instanceof Error ? error.message : 'Error desconocido del proveedor.'
  return new NavProviderError(provider, sanitizeError(message), sourceUrl)
}

function normalizeIsin(isin: string) {
  return isin.trim().toUpperCase()
}

function isRecord(value: Json): value is MetadataJson {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export type { FundMetadataResult, NavQuote, NavProvider, NavRefreshResult }
