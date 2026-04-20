import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { NormalizedImportRow } from '@/lib/data/imports'
import type { TransactionType } from '@/lib/supabase/types'

const transactionMap: Record<string, TransactionType> = {
  compra: 'buy',
  comprar: 'buy',
  suscripcion: 'buy',
  suscripción: 'buy',
  venta: 'sell',
  vender: 'sell',
  reembolso: 'sell',
  traspaso_entrada: 'transfer_in',
  'traspaso entrada': 'transfer_in',
  entrada: 'transfer_in',
  traspaso_salida: 'transfer_out',
  'traspaso salida': 'transfer_out',
  salida: 'transfer_out',
  switch_in: 'switch_in',
  switch_out: 'switch_out',
}

export function parseManualRows(rows: unknown) {
  if (!Array.isArray(rows)) return []
  return rows.map(normalizeRawRow).filter(Boolean) as NormalizedImportRow[]
}

export function parseCsv(content: string) {
  const result = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeHeader(header),
  })

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? 'No se pudo parsear el CSV.')
  }

  return result.data.map(normalizeRawRow).filter(Boolean) as NormalizedImportRow[]
}

export function parseExcel(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false })
  return rows.map(normalizeRawRow).filter(Boolean) as NormalizedImportRow[]
}

function normalizeRawRow(raw: Record<string, unknown>): NormalizedImportRow | null {
  const row = normalizeKeys(raw)
  const isin = pick(row, ['isin', 'codigo_isin', 'isin_fondo'])
  const fundName = pick(row, ['fondo', 'fund', 'nombre', 'nombre_fondo', 'producto'])
  const type = normalizeTransactionType(pick(row, ['tipo', 'tipo_movimiento', 'operacion', 'operación', 'transaction_type']))
  const tradeDate = normalizeDate(pick(row, ['fecha', 'fecha_operacion', 'fecha_operación', 'trade_date']))
  const amount = parseNumber(pick(row, ['importe', 'importe_eur', 'amount', 'amount_eur', 'total']))
  const shares = parseNumber(pick(row, ['participaciones', 'shares', 'titulos', 'títulos', 'cantidad']))
  const nav = parseNumber(pick(row, ['nav', 'valor_liquidativo', 'precio', 'precio_nav']))

  if (!isin && !fundName && !amount && !shares) return null

  return {
    fund_name: fundName,
    isin,
    transaction_type: type,
    trade_date: tradeDate,
    amount_eur: amount,
    shares,
    nav,
    confidence: 0.85,
    notes: null,
  }
}

function normalizeKeys(raw: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [normalizeHeader(key), value]))
}

function normalizeHeader(header: string) {
  return header
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
  return transactionMap[key] ?? null
}

function parseNumber(value: string | null) {
  if (!value) return null
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')
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
