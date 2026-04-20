import { load } from 'cheerio'

const monthMap: Record<string, string> = {
  jan: '01',
  january: '01',
  ene: '01',
  enero: '01',
  feb: '02',
  february: '02',
  febrero: '02',
  mar: '03',
  march: '03',
  marzo: '03',
  apr: '04',
  april: '04',
  abr: '04',
  abril: '04',
  may: '05',
  mayo: '05',
  jun: '06',
  june: '06',
  junio: '06',
  jul: '07',
  july: '07',
  julio: '07',
  aug: '08',
  august: '08',
  ago: '08',
  agosto: '08',
  sep: '09',
  sept: '09',
  september: '09',
  septiembre: '09',
  oct: '10',
  october: '10',
  octubre: '10',
  nov: '11',
  november: '11',
  noviembre: '11',
  dec: '12',
  december: '12',
  dic: '12',
  diciembre: '12',
}

export class NavProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
    public sourceUrl?: string
  ) {
    super(message)
    this.name = 'NavProviderError'
  }
}

export async function fetchHtml(url: string, provider: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,es;q=0.8',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new NavProviderError(provider, `HTTP ${response.status} al consultar la fuente.`, url)
    }

    return response.text()
  } catch (error) {
    if (error instanceof NavProviderError) throw error
    const message = error instanceof Error ? sanitizeError(error.message) : 'Error desconocido de red.'
    throw new NavProviderError(provider, message, url)
  } finally {
    clearTimeout(timeout)
  }
}

export function htmlToLines(html: string) {
  const $ = load(html)
  return normalizeWhitespace($('body').text())
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
}

export function htmlToText(html: string) {
  const $ = load(html)
  return normalizeWhitespace($('body').text())
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim()
}

export function parseNumber(value: string | undefined) {
  if (!value) return null
  const cleaned = value
    .replace(/[€$£US]/g, '')
    .replace(/[^\d,.'-]/g, '')
    .replace(/[']/g, '')
    .trim()

  if (!cleaned) return null

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const decimalSeparator = lastComma > lastDot ? ',' : '.'
  const normalized =
    decimalSeparator === ','
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '')

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseDate(value: string | undefined) {
  if (!value) return null
  const clean = normalizeWhitespace(value).replace(/\./g, ' ').replace(/\//g, ' ').replace(/,/g, ' ')

  const isoMatch = clean.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (isoMatch) return toIsoDate(isoMatch[1], isoMatch[2], isoMatch[3])

  const dmyNumeric = clean.match(/\b(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/)
  if (dmyNumeric) return toIsoDate(normalizeYear(dmyNumeric[3]), dmyNumeric[2], dmyNumeric[1])

  const dmy = clean.match(/\b(\d{1,2})\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+(\d{2,4})\b/)
  if (dmy) {
    const month = monthMap[dmy[2].toLowerCase()]
    if (month) return toIsoDate(normalizeYear(dmy[3]), month, dmy[1])
  }

  const mdy = clean.match(/\b([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+(\d{1,2})\s+(\d{2,4})\b/)
  if (mdy) {
    const month = monthMap[mdy[1].toLowerCase()]
    if (month) return toIsoDate(normalizeYear(mdy[3]), month, mdy[2])
  }

  return null
}

export function subtractDays(date: Date, days: number) {
  const clone = new Date(date)
  clone.setUTCDate(clone.getUTCDate() - days)
  return clone.toISOString().slice(0, 10)
}

export function sanitizeError(message: string) {
  return message.replace(/\s+/g, ' ').slice(0, 500)
}

export function validateQuote(quote: {
  isin: string
  navDate: string | null
  nav: number | null
  currency: string | undefined
  source: string
  sourceUrl: string
  rawPayload: Record<string, unknown>
}) {
  if (!quote.navDate) throw new NavProviderError(quote.source, `No se pudo leer la fecha NAV de ${quote.isin}.`, quote.sourceUrl)
  if (!quote.nav || quote.nav <= 0) throw new NavProviderError(quote.source, `NAV invalido para ${quote.isin}.`, quote.sourceUrl)
  if (!quote.currency || !/^[A-Z]{3}$/.test(quote.currency)) {
    throw new NavProviderError(quote.source, `Divisa invalida para ${quote.isin}.`, quote.sourceUrl)
  }

  return {
    isin: quote.isin,
    navDate: quote.navDate,
    nav: quote.nav,
    currency: quote.currency,
    source: quote.source,
    sourceUrl: quote.sourceUrl,
    rawPayload: quote.rawPayload,
  }
}

export function uniqueQuotesByDate<T extends { navDate: string }>(quotes: T[]) {
  const byDate = new Map<string, T>()
  for (const quote of quotes) byDate.set(quote.navDate, quote)
  return Array.from(byDate.values()).sort((a, b) => a.navDate.localeCompare(b.navDate))
}

function normalizeYear(value: string) {
  if (value.length === 2) return Number(value) > 70 ? `19${value}` : `20${value}`
  return value
}

function toIsoDate(year: string, month: string, day: string) {
  const yyyy = year.padStart(4, '0')
  const mm = month.padStart(2, '0')
  const dd = day.padStart(2, '0')
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return `${yyyy}-${mm}-${dd}`
}
