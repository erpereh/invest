import { load } from 'cheerio'
import type { FundMetadataResult, NavProvider, NavQuote } from '@/lib/services/nav/types'
import { fetchHtml, htmlToLines, NavProviderError, parseDate, parseNumber, validateQuote } from '@/lib/services/nav/utils'

const BLACKROCK_FUNDS: Record<string, { productId: string; name: string; region: string; category: string }> = {
  IE000ZYRH0Q7: {
    productId: '345277',
    name: 'iShares Developed World Index Fund (IE) Acc EUR clase S',
    region: 'developed_world',
    category: 'global_developed_index',
  },
  IE000QAZP7L2: {
    productId: '345276',
    name: 'iShares Emerging Markets Index Fund (IE) Acc EUR clase S',
    region: 'emerging_markets',
    category: 'emerging_markets_index',
  },
}

export const blackrockProvider: NavProvider = {
  name: 'blackrock',
  supports(isin) {
    return Boolean(BLACKROCK_FUNDS[normalizeIsin(isin)])
  },
  getSourceUrl(isin) {
    const fund = BLACKROCK_FUNDS[normalizeIsin(isin)]
    return fund ? `https://www.blackrock.com/lu/intermediaries/products/${fund.productId}/` : undefined
  },
  async fetchMetadataByIsin(isin) {
    const normalized = normalizeIsin(isin)
    const fund = BLACKROCK_FUNDS[normalized]
    const sourceUrl = this.getSourceUrl(normalized)
    if (!fund || !sourceUrl) throw new NavProviderError(this.name, `ISIN no soportado por BlackRock: ${isin}.`, sourceUrl)

    return {
      isin: normalized,
      name: fund.name,
      managementCompany: 'BlackRock',
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
    if (!latest) throw new NavProviderError(this.name, `BlackRock no devolvio NAV para ${isin}.`, this.getSourceUrl(isin))
    return latest
  },
  async fetchHistoricalNavsByIsin(isin, fromDate) {
    const normalized = normalizeIsin(isin)
    const sourceUrl = this.getSourceUrl(normalized)
    if (!sourceUrl) throw new NavProviderError(this.name, `ISIN no soportado por BlackRock: ${isin}.`)

    const html = await fetchHtml(sourceUrl, this.name)
    const quote = parseBlackRockTableRow(html, normalized, sourceUrl) ?? parseBlackRockPricingRow(htmlToLines(html), normalized, sourceUrl)
    return !fromDate || quote.navDate >= fromDate ? [quote] : []
  },
}

function parseBlackRockTableRow(html: string, isin: string, sourceUrl: string): NavQuote | null {
  const $ = load(html)
  let quote: NavQuote | null = null

  $('tr').each((_, row) => {
    if (quote) return
    const cells = $(row)
      .find('th,td')
      .map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean)

    if (!cells.some((cell) => cell.toUpperCase() === isin)) return
    const isinIndex = cells.findIndex((cell) => cell.toUpperCase() === isin)
    const beforeIsin = cells.slice(Math.max(0, isinIndex - 8), isinIndex)
    const currency = beforeIsin.find((cell) => /^[A-Z]{3}$/.test(cell)) ?? 'EUR'
    const dateCell = beforeIsin.find((cell) => Boolean(parseDate(cell)))
    const currencyIndex = beforeIsin.findIndex((cell) => cell === currency)
    const nav = parseNumber(beforeIsin[currencyIndex + 1])

    quote = validateQuote({
      isin,
      navDate: parseDate(dateCell),
      nav,
      currency,
      source: 'blackrock',
      sourceUrl,
      rawPayload: {
        rowCells: cells,
        matchedIsin: isin,
      },
    })
  })

  return quote
}

function parseBlackRockPricingRow(lines: string[], isin: string, sourceUrl: string): NavQuote {
  const index = lines.findIndex((line) => line.toUpperCase() === isin)
  if (index < 0) throw new NavProviderError('blackrock', `No se encontro la fila de precios para ${isin}.`, sourceUrl)

  const window = lines.slice(Math.max(0, index - 12), index)
  const dateIndex = findLastIndex(window, (line) => Boolean(parseDate(line)))
  if (dateIndex < 0) throw new NavProviderError('blackrock', `No se encontro fecha NAV para ${isin}.`, sourceUrl)

  const currencyIndex = findLastIndex(window.slice(0, dateIndex), (line) => /^[A-Z]{3}$/.test(line))
  const currency = currencyIndex >= 0 ? window[currencyIndex] : 'EUR'
  const nav = parseNumber(window[currencyIndex + 1]) ?? parseNumber(window[dateIndex - 3])
  const navDate = parseDate(window[dateIndex])

  return validateQuote({
    isin,
    navDate,
    nav,
    currency,
    source: 'blackrock',
    sourceUrl,
    rawPayload: {
      rowWindow: window,
      matchedIsin: isin,
    },
  })
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) return index
  }
  return -1
}

function normalizeIsin(isin: string) {
  return isin.trim().toUpperCase()
}
