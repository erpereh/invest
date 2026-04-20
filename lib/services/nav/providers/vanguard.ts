import type { FundMetadataResult, NavProvider, NavQuote } from '@/lib/services/nav/types'
import { fetchHtml, htmlToText, NavProviderError, parseDate, parseNumber, uniqueQuotesByDate, validateQuote } from '@/lib/services/nav/utils'

const VANGUARD_FUNDS: Record<string, { productId: string; slug: string; name: string; region: string; category: string }> = {
  IE00B42W3S00: {
    productId: '9248',
    slug: 'global-small-cap-index-fund-eur',
    name: 'Vanguard Global Small-Cap Index Fund Investor EUR Accumulation',
    region: 'global',
    category: 'global_small_cap_index',
  },
}

export const vanguardProvider: NavProvider = {
  name: 'vanguard',
  supports(isin) {
    return Boolean(VANGUARD_FUNDS[normalizeIsin(isin)])
  },
  getSourceUrl(isin) {
    const fund = VANGUARD_FUNDS[normalizeIsin(isin)]
    return fund ? `https://www.vanguard.co.uk/professional/product/fund/equity/${fund.productId}/${fund.slug}` : undefined
  },
  async fetchMetadataByIsin(isin) {
    const normalized = normalizeIsin(isin)
    const fund = VANGUARD_FUNDS[normalized]
    const sourceUrl = this.getSourceUrl(normalized)
    if (!fund || !sourceUrl) throw new NavProviderError(this.name, `ISIN no soportado por Vanguard: ${isin}.`, sourceUrl)

    return {
      isin: normalized,
      name: fund.name,
      managementCompany: 'Vanguard',
      currency: 'EUR',
      region: fund.region,
      category: fund.category,
      officialUrl: sourceUrl,
      provider: this.name,
      sourceStatus: 'success',
      rawPayload: { productId: fund.productId, sourceUrl },
    } satisfies FundMetadataResult
  },
  async fetchLatestNavByIsin(isin) {
    const rows = await this.fetchHistoricalNavsByIsin(isin)
    const latest = rows.at(-1)
    if (!latest) throw new NavProviderError(this.name, `Vanguard no devolvio NAV para ${isin}.`, this.getSourceUrl(isin))
    return latest
  },
  async fetchHistoricalNavsByIsin(isin, fromDate) {
    const normalized = normalizeIsin(isin)
    const sourceUrl = this.getSourceUrl(normalized)
    if (!sourceUrl) throw new NavProviderError(this.name, `ISIN no soportado por Vanguard: ${isin}.`)

    const html = await fetchHtml(sourceUrl, this.name)
    const text = htmlToText(html)
    const quotes = parseVanguardHistoricalRows(text, normalized, sourceUrl)
    return quotes.filter((quote) => !fromDate || quote.navDate >= fromDate)
  },
}

function parseVanguardHistoricalRows(text: string, isin: string, sourceUrl: string): NavQuote[] {
  const quotes: NavQuote[] = []
  const rowPattern = /\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\s+(?:€|EUR)?\s*([\d,.']{2,})\b/g
  let match: RegExpExecArray | null

  while ((match = rowPattern.exec(text)) !== null) {
    const navDate = parseDate(match[1])
    const nav = parseNumber(match[2])
    if (!navDate || !nav) continue

    quotes.push(
      validateQuote({
        isin,
        navDate,
        nav,
        currency: 'EUR',
        source: 'vanguard',
        sourceUrl,
        rawPayload: {
          row: match[0],
          matchedIsin: isin,
        },
      })
    )
  }

  const unique = uniqueQuotesByDate(quotes)
  if (unique.length === 0) throw new NavProviderError('vanguard', `No se encontraron precios historicos para ${isin}.`, sourceUrl)
  return unique
}

function normalizeIsin(isin: string) {
  return isin.trim().toUpperCase()
}
