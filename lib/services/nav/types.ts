import type { Json } from '@/lib/supabase/types'

export type NavSourceStatus = 'success' | 'failed' | 'unsupported'

export interface FundMetadataResult {
  isin: string
  name?: string
  managementCompany?: string
  currency?: string
  region?: string
  category?: string
  officialUrl?: string
  provider: string
  sourceStatus: NavSourceStatus
  rawPayload: Record<string, unknown>
}

export interface NavQuote {
  isin: string
  navDate: string
  nav: number
  currency: string
  source: string
  sourceUrl: string
  rawPayload: Record<string, unknown>
}

export interface NavProviderAttempt {
  provider: string
  sourceUrl?: string
  ok: boolean
  rows: number
  error?: string
}

export interface NavProvider {
  name: string
  supports(isin: string): boolean
  getSourceUrl(isin: string): string | undefined
  fetchMetadataByIsin(isin: string): Promise<FundMetadataResult>
  fetchLatestNavByIsin(isin: string): Promise<NavQuote>
  fetchHistoricalNavsByIsin(isin: string, fromDate?: string): Promise<NavQuote[]>
}

export interface NavRefreshFundResult {
  fundId: string
  isin: string
  provider: string | null
  status: NavSourceStatus
  sourceUrl?: string
  importedRows: number
  changedRows: number
  attempts: NavProviderAttempt[]
  error?: string
}

export interface NavRefreshResult {
  refreshed: number
  changedRows: number
  missing: string[]
  funds: NavRefreshFundResult[]
  recalculation: unknown
  note?: string
}

export type MetadataJson = Record<string, Json | undefined>
