import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { NormalizedImportRow } from '@/lib/data/imports'
import type { TransactionType } from '@/lib/supabase/types'

const transactionMap: Record<string, TransactionType> = {
  compra: 'buy',
  comprar: 'buy',
  compras: 'buy',
  suscripcion: 'buy',
  suscripciones: 'buy',
  aportacion: 'buy',
  aportaciones: 'buy',
  venta: 'sell',
  ventas: 'sell',
  vender: 'sell',
  reembolso: 'sell',
  reembolsos: 'sell',
  traspaso_entrada: 'transfer_in',
  traspaso_entrante: 'transfer_in',
  entrada: 'transfer_in',
  entrante: 'transfer_in',
  recibido: 'transfer_in',
  traspaso_salida: 'transfer_out',
  traspaso_saliente: 'transfer_out',
  salida: 'transfer_out',
  saliente: 'transfer_out',
  enviado: 'transfer_out',
  switch_in: 'switch_in',
  switch_entrada: 'switch_in',
  cambio_entrada: 'switch_in',
  switch_out: 'switch_out',
  switch_salida: 'switch_out',
  cambio_salida: 'switch_out',
}

export function parseManualRows(rows: unknown) {
  if (!Array.isArray(rows)) return []
  return rows.map((row, index) => normalizeRawRow(asRecord(row), index + 1)).filter(Boolean) as NormalizedImportRow[]
}

export function parseCsv(content: string) {
  const cleanContent = stripBom(content)
  const result = Papa.parse<Record<string, unknown>>(cleanContent, {
    delimiter: detectDelimiter(cleanContent),
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeHeader(header),
  })

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? 'No se pudo parsear el CSV.')
  }

  return result.data.map((row, index) => normalizeRawRow(row, index + 1)).filter(Boolean) as NormalizedImportRow[]
}

export function parseExcel(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: null })
  return rows.map((row, index) => normalizeRawRow(row, index + 1)).filter(Boolean) as NormalizedImportRow[]
}

function normalizeRawRow(raw: Record<string, unknown>, rowIndex: number): NormalizedImportRow | null {
  const row = normalizeKeys(raw)
  const fullText = Object.values(row).map((value) => String(value ?? '')).join(' ')
  const isin =
    pick(row, ['isin', 'codigo_isin', 'codigo isin', 'isin_fondo', 'isin fondo', 'valor', 'producto', 'instrumento']) ??
    extractIsin(fullText)
  const fundName = pick(row, ['fondo', 'fund', 'nombre', 'nombre_fondo', 'nombre fondo', 'producto', 'descripcion', 'descripción'])
  const type = normalizeTransactionType(
    pick(row, [
      'tipo',
      'tipo_movimiento',
      'tipo movimiento',
      'operacion',
      'operación',
      'movimiento',
      'concepto',
      'descripcion',
      'descripción',
      'transaction_type',
      'orden',
      'tipo_orden',
    ]) ?? fullText
  )
  const tradeDate = normalizeDate(
    pick(row, [
      'fecha',
      'fecha_operacion',
      'fecha operación',
      'fecha_valor',
      'fecha valor',
      'fecha_orden',
      'fecha orden',
      'fecha_contratacion',
      'fecha contratación',
      'trade_date',
    ])
  )
  const amount = parseNumber(
    pick(row, [
      'importe',
      'importe_eur',
      'importe eur',
      'importe_bruto',
      'importe bruto',
      'importe_neto',
      'importe neto',
      'efectivo',
      'total',
      'amount',
      'amount_eur',
      'valor_efectivo',
      'neto',
    ])
  )
  const shares = parseNumber(
    pick(row, [
      'participaciones',
      'participacion',
      'shares',
      'titulos',
      'títulos',
      'cantidad',
      'unidades',
      'numero_participaciones',
      'n_participaciones',
      'num_participaciones',
    ])
  )
  const nav = parseNumber(pick(row, ['nav', 'valor_liquidativo', 'valor liquidativo', 'precio', 'precio_nav', 'vl']))

  if (!isin && !fundName && !amount && !shares) return null

  return {
    fund_name: fundName,
    isin,
    transaction_type: type,
    trade_date: tradeDate,
    amount_eur: amount,
    shares,
    nav,
    confidence: type && tradeDate && amount && shares ? 0.95 : 0.65,
    notes: `Fila ${rowIndex}`,
    raw,
  }
}

function normalizeKeys(raw: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [normalizeHeader(key), value]))
}

function normalizeHeader(header: string) {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[normalizeHeader(key)]
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return null
}

function normalizeTransactionType(value: string | null): TransactionType | null {
  if (!value) return null
  const key = normalizeHeader(value)
  if (transactionMap[key]) return transactionMap[key]
  if (key.includes('traspaso') && (key.includes('entrada') || key.includes('entrante') || key.includes('recibido'))) return 'transfer_in'
  if (key.includes('traspaso') && (key.includes('salida') || key.includes('saliente') || key.includes('enviado'))) return 'transfer_out'
  if (key.includes('switch') && (key.includes('entrada') || key.includes('in'))) return 'switch_in'
  if (key.includes('switch') && (key.includes('salida') || key.includes('out'))) return 'switch_out'
  if (key.includes('suscrip') || key.includes('compra') || key.includes('aportaci')) return 'buy'
  if (key.includes('reembolso') || key.includes('venta')) return 'sell'
  return null
}

function parseNumber(value: string | null) {
  if (!value) return null
  const cleaned = value.replace(/\s/g, '').replace(/[€$]/g, '')
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const decimal = lastComma > lastDot ? ',' : '.'
  const normalized =
    decimal === ','
      ? cleaned.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')
      : cleaned.replace(/,/g, '').replace(/[^0-9.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.abs(parsed) : null
}

function normalizeDate(value: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const spanish = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (!spanish) return null
  const year = spanish[3].length === 2 ? `20${spanish[3]}` : spanish[3]
  return `${year}-${spanish[2].padStart(2, '0')}-${spanish[1].padStart(2, '0')}`
}

function stripBom(content: string) {
  return content.replace(/^\uFEFF/, '')
}

function detectDelimiter(content: string) {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? ''
  const semicolons = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semicolons > commas ? ';' : undefined
}

function extractIsin(value: string) {
  return value.match(/\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b/i)?.[0]?.toUpperCase() ?? null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}
