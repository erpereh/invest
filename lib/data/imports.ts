import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { ImportRow, TransactionType } from '@/lib/supabase/types'
import { normalizeIsin } from '@/lib/data/format'
import { recalculateHoldings } from '@/lib/services/holdings'

export interface NormalizedImportRow {
  fund_name?: string | null
  isin?: string | null
  transaction_type?: TransactionType | null
  trade_date?: string | null
  amount_eur?: number | null
  shares?: number | null
  nav?: number | null
  confidence?: number | null
  notes?: string | null
}

export async function createImportWithRows(input: {
  importType: 'manual' | 'csv' | 'excel' | 'image' | 'text'
  sourceName: string
  originalFilename?: string | null
  rawText?: string | null
  rawJson?: Record<string, unknown> | null
  rows: NormalizedImportRow[]
}) {
  const supabase = createServiceSupabaseClient()
  const { data: importJob, error: importError } = await supabase
    .from('imports')
    .insert({
      import_type: input.importType,
      source_name: input.sourceName,
      original_filename: input.originalFilename ?? null,
      status: 'parsed',
      parsed_rows: input.rows.length,
      accepted_rows: 0,
      rejected_rows: input.rows.filter((row) => !isValidDetectedRow(row)).length,
      raw_text: input.rawText ?? null,
      raw_json: input.rawJson ?? null,
    })
    .select('*')
    .single()

  if (importError) throw new Error(importError.message)

  const rows = input.rows.map((row, index) => {
    const validation = validateDetectedRow(row)
    return {
      import_id: importJob.id,
      row_index: index + 1,
      detected_fund_name: row.fund_name ?? null,
      detected_isin: row.isin ? normalizeIsin(row.isin) : null,
      detected_transaction_type: row.transaction_type ?? null,
      detected_trade_date: row.trade_date ?? null,
      detected_amount: row.amount_eur ?? null,
      detected_shares: row.shares ?? null,
      detected_nav: row.nav ?? null,
      confidence: row.confidence ?? null,
      normalized_json: row as Record<string, unknown>,
      validation_status: validation.ok ? 'valid' : 'invalid',
      validation_error: validation.error,
    }
  })

  if (rows.length > 0) {
    const { error: rowsError } = await supabase.from('import_rows').insert(rows)
    if (rowsError) throw new Error(rowsError.message)
  }

  return getImportDetails(importJob.id)
}

export async function getImportDetails(importId: string) {
  const supabase = createServiceSupabaseClient()
  const [{ data: importJob, error: importError }, { data: rows, error: rowsError }] = await Promise.all([
    supabase.from('imports').select('*').eq('id', importId).single(),
    supabase.from('import_rows').select('*').eq('import_id', importId).order('row_index'),
  ])

  if (importError) throw new Error(importError.message)
  if (rowsError) throw new Error(rowsError.message)

  return { importJob, rows: rows ?? [] }
}

export async function acceptImportRows(importId: string, rowIds?: string[]) {
  const supabase = createServiceSupabaseClient()
  let query = supabase.from('import_rows').select('*').eq('import_id', importId).eq('validation_status', 'valid')
  if (rowIds && rowIds.length > 0) {
    query = query.in('id', rowIds)
  }

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)

  const validRows = rows ?? []
  const acceptedIds: string[] = []

  for (const row of validRows) {
    const inserted = await insertTransactionFromImportRow(importId, row)
    if (inserted) acceptedIds.push(row.id)
  }

  if (acceptedIds.length > 0) {
    await supabase.from('import_rows').update({ validation_status: 'accepted' }).in('id', acceptedIds)
  }

  await supabase
    .from('imports')
    .update({
      status: 'imported',
      accepted_rows: acceptedIds.length,
      rejected_rows: Math.max(0, validRows.length - acceptedIds.length),
    })
    .eq('id', importId)

  await recalculateHoldings()
  return { accepted: acceptedIds.length }
}

export async function rejectImportRows(importId: string, rowIds?: string[]) {
  const supabase = createServiceSupabaseClient()
  let query = supabase.from('import_rows').update({ validation_status: 'rejected' }).eq('import_id', importId).select('id')
  if (rowIds && rowIds.length > 0) {
    query = query.in('id', rowIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return { rejected: data?.length ?? 0 }
}

function validateDetectedRow(row: NormalizedImportRow) {
  if (!row.isin || !/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i.test(row.isin.trim())) {
    return { ok: false, error: 'ISIN ausente o invalido.' }
  }
  if (!row.transaction_type) return { ok: false, error: 'Tipo de movimiento ausente.' }
  if (!row.trade_date) return { ok: false, error: 'Fecha ausente.' }
  if (row.amount_eur == null || row.amount_eur < 0) return { ok: false, error: 'Importe invalido.' }
  if (row.shares == null || row.shares <= 0) return { ok: false, error: 'Participaciones invalidas.' }
  if (row.nav != null && row.nav <= 0) return { ok: false, error: 'NAV invalido.' }
  return { ok: true, error: null }
}

function isValidDetectedRow(row: NormalizedImportRow) {
  return validateDetectedRow(row).ok
}

async function insertTransactionFromImportRow(importId: string, row: ImportRow) {
  const supabase = createServiceSupabaseClient()
  if (!row.detected_isin || !row.detected_transaction_type || !row.detected_trade_date || !row.detected_amount || !row.detected_shares) {
    return false
  }

  const [{ data: account }, { data: fund }] = await Promise.all([
    supabase.from('accounts').select('id').eq('active', true).order('created_at').limit(1).maybeSingle(),
    supabase.from('funds').select('id').eq('isin', normalizeIsin(row.detected_isin)).maybeSingle(),
  ])

  if (!account || !fund) {
    await supabase
      .from('import_rows')
      .update({ validation_status: 'invalid', validation_error: 'No se encontro cuenta activa o fondo por ISIN.' })
      .eq('id', row.id)
    return false
  }

  const { error } = await supabase.from('transactions').insert({
    account_id: account.id,
    fund_id: fund.id,
    transaction_type: row.detected_transaction_type,
    trade_date: row.detected_trade_date,
    amount_eur: row.detected_amount,
    nav_used: row.detected_nav,
    shares: row.detected_shares,
    fee_amount: null,
    source: 'import',
    notes: null,
    raw_import_id: importId,
  })

  if (error) {
    await supabase.from('import_rows').update({ validation_status: 'invalid', validation_error: error.message }).eq('id', row.id)
    return false
  }

  return true
}
