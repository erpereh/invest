import type { FundMetadataResult, NavProvider, NavQuote } from '@/lib/services/nav/types'
import { fetchHtml, htmlToText, NavProviderError, parseDate, parseNumber, uniqueQuotesByDate, validateQuote } from '@/lib/services/nav/utils'
import { morningstarProvider } from '@/lib/services/nav/providers/morningstar'

const INVESTING_URLS: Record<string, { url: string; name: string; managementCompany: string; currency: string }> = {
  IE000ZYRH0Q7: {
    url: 'https://www.investing.com/funds/ie000zyrh0q7-historical-data',
    name: 'iShares Developed World Index Fund (IE) S Acc EUR',
    managementCompany: 'iShares',
    currency: 'EUR',
  },
  IE000QAZP7L2: {
    url: 'https://www.investing.com/funds/ie000qazp7l2-historical-data',
    name: 'iShares Emerging Markets Index Fund (IE) S Acc EUR',
    managementCompany: 'iShares',
    currency: 'EUR',
  },
  IE00B42W3S00: {
    url: 'https://www.investing.com/funds/vanguard-global-smallcap-index-fund-historical-data',
    name: 'Vanguard Global Small-Cap Index Fund Investor EUR Accumulation',
    managementCompany: 'Vanguard',
    currency: 'EUR',
  },
}

export const fallbackProvider: NavProvider = {
  name: 'fallback',
  supports(isin) {
    return Boolean(INVESTING_URLS[normalizeIsin(isin)])
  },
  getSourceUrl(isin) {
    return INVESTING_URLS[normalizeIsin(isin)]?.url
  },
  async fetchMetadataByIsin(isin) {
    const normalized = normalizeIsin(isin)
    const mapped = INVESTING_URLS[normalized]
    if (!mapped) return morningstarProvider.fetchMetadataByIsin(normalized)

    return {
      isin: normalized,
      name: mapped.name,
      managementCompany: mapped.managementCompany,
      currency: mapped.currency,
      officialUrl: mapped.url,
      provider: 'investing',
      sourceStatus: 'success',
      rawPayload: { sourceUrl: mapped.url },
    } satisfies FundMetadataResult
  },
  async fetchLatestNavByIsin(isin) {
    const rows = await this.fetchHistoricalNavsByIsin(isin)
    const latest = rows.at(-1)
    if (!latest) throw new NavProviderError(this.name, `Fallback no devolvio NAV para ${isin}.`, this.getSourceUrl(isin))
    return latest
  },
  async fetchHistoricalNavsByIsin(isin, fromDate) {
    const normalized = normalizeIsin(isin)
    const mapped = INVESTING_URLS[normalized]
    if (!mapped) throw new NavProviderError(this.name, `No hay fallback mapeado para ${isin}.`)

    const html = await fetchHtml(mapped.url, this.name)
    const text = htmlToText(html)
    const quotes = parseInvestingRows(text, normalized, mapped.url, mapped.currency)
    return quotes.filter((quote) => !fromDate || quote.navDate >= fromDate)
  },
}

function parseInvestingRows(text: string, isin: string, sourceUrl: string, currency: string): NavQuote[] {
  const quotes: NavQuote[] = []
  const patterns = [
    /\b([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})\s+([\d,.']{1,})\s+/g,
    /\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\s+([\d,.']{1,})\s+/g,
    /\b(\d{4}-\d{2}-\d{2})\s+([\d,.']{1,})\s+/g,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const navDate = parseDate(match[1])
      const nav = parseNumber(match[2])
      if (!navDate || !nav) continue

      quotes.push(
        validateQuote({
          isin,
          navDate,
          nav,
          currency,
          source: 'investing',
          sourceUrl,
          rawPayload: {
            row: match[0],
            matchedIsin: isin,
          },
        })
      )
    }
  }

  const unique = uniqueQuotesByDate(quotes)
  if (unique.length === 0) throw new NavProviderError('fallback', `No se encontraron precios historicos en Investing para ${isin}.`, sourceUrl)
  return unique
}

function normalizeIsin(isin: string) {
  return isin.trim().toUpperCase()
}
