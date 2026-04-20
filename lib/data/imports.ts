import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { ImportRow, TransactionType } from '@/lib/supabase/types'
import { resolveFundByIsin } from '@/lib/data/funds'
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
  raw?: Record<string, unknown> | null
  source_format?: string | null
  validation_error?: string | null
}

interface ImportTransactionResult {
  rowId: string
  status: 'created' | 'duplicate' | 'invalid'
  transactionId?: string
  error?: string
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
  const invalidRows = input.rows.filter((row) => !isValidDetectedRow(row)).length
  const { data: importJob, error: importError } = await supabase
    .from('imports')
    .insert({
      import_type: input.importType,
      source_name: input.sourceName,
      original_filename: input.originalFilename ?? null,
      status: input.rows.length === invalidRows ? 'failed' : 'parsed',
      parsed_rows: input.rows.length,
      accepted_rows: 0,
      rejected_rows: invalidRows,
      raw_text: input.rawText ?? null,
      raw_json: input.rawJson ?? null,
      error_message: input.rows.length === invalidRows && input.rows.length > 0 ? 'No se detectaron filas validas.' : null,
    })
    .select('*')
    .single()

  if (importError) throw new Error(importError.message)

  const resolvedRows = await Promise.all(input.rows.map(resolveImportRowFund))

  const rows = resolvedRows.map((row, index) => {
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
      normalized_json: {
        ...row,
        parser_version: 2,
        raw: row.raw ?? null,
        source_format: row.source_format ?? null,
      },
      validation_status: validation.ok ? 'valid' : 'invalid',
      validation_error: validation.error,
    }
  })

  if (rows.length > 0) {
    const { error: rowsError } = await supabase.from('import_rows').insert(rows)
    if (rowsError) throw new Error(rowsError.message)
  }

  console.info('[imports] import created', {
    importId: importJob.id,
    type: input.importType,
    rows: rows.length,
    invalidRows,
  })

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
  let query = supabase.from('import_rows').select('*').eq('import_id', importId)
  if (rowIds && rowIds.length > 0) {
    query = query.in('id', rowIds)
  }

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)

  const rowsToProcess = rows ?? []
  const acceptedIds: string[] = []
  const invalidResults: ImportTransactionResult[] = []
  const duplicateResults: ImportTransactionResult[] = []
  const createdResults: ImportTransactionResult[] = []

  console.info('[imports] accepting import', { importId, requestedRows: rowIds?.length ?? null, rows: rowsToProcess.length })

  for (const row of rowsToProcess) {
    const validation = validateImportRowRecord(row)
    if (!validation.ok) {
      invalidResults.push({ rowId: row.id, status: 'invalid', error: validation.error ?? 'Fila invalida.' })
      await supabase
        .from('import_rows')
        .update({ validation_status: 'invalid', validation_error: validation.error })
        .eq('id', row.id)
      console.warn('[imports] invalid row skipped', { importId, rowId: row.id, error: validation.error })
      continue
    }

    const result = await insertTransactionFromImportRow(importId, row)
    if (result.status === 'created') createdResults.push(result)
    if (result.status === 'duplicate') duplicateResults.push(result)
    if (result.status === 'invalid') invalidResults.push(result)
    if (result.status === 'created' || result.status === 'duplicate') acceptedIds.push(row.id)
  }

  if (acceptedIds.length > 0) {
    await supabase.from('import_rows').update({ validation_status: 'accepted', validation_error: null }).in('id', acceptedIds)
  }

  const updatedRows = await getImportRows(importId)
  const acceptedCount = updatedRows.filter((row) => row.validation_status === 'accepted' || acceptedIds.includes(row.id)).length
  const rejectedCount = updatedRows.filter((row) => row.validation_status === 'rejected').length
  const invalidCount = updatedRows.filter((row) => row.validation_status === 'invalid' && !acceptedIds.includes(row.id)).length
  const status = acceptedCount > 0 ? 'imported' : 'failed'

  await supabase
    .from('imports')
    .update({
      status,
      accepted_rows: acceptedCount,
      rejected_rows: rejectedCount + invalidCount,
      error_message: acceptedCount > 0 ? null : 'No se pudo crear ninguna transaccion desde las filas del import.',
    })
    .eq('id', importId)

  const recalculation = acceptedIds.length > 0 ? await recalculateHoldings() : null
  console.info('[imports] import accepted result', {
    importId,
    created: createdResults.length,
    duplicates: duplicateResults.length,
    invalid: invalidResults.length,
    accepted: acceptedIds.length,
    recalculation,
  })

  return {
    accepted: acceptedIds.length,
    created: createdResults.length,
    duplicates: duplicateResults.length,
    invalid: invalidResults.length,
    recalculation,
  }
}

export async function rejectImportRows(importId: string, rowIds?: string[]) {
  const supabase = createServiceSupabaseClient()
  let query = supabase.from('import_rows').update({ validation_status: 'rejected' }).eq('import_id', importId).select('id')
  if (rowIds && rowIds.length > 0) {
    query = query.in('id', rowIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  await updateImportStatus(importId)
  console.info('[imports] import rows rejected', { importId, rejected: data?.length ?? 0 })
  return { rejected: data?.length ?? 0 }
}

function validateDetectedRow(row: NormalizedImportRow) {
  if (row.validation_error) return { ok: false, error: row.validation_error }
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

async function resolveImportRowFund(row: NormalizedImportRow): Promise<NormalizedImportRow> {
  if (!row.isin) return row

  try {
    const fund = await resolveFundByIsin(row.isin)
    if (!fund) return row
    return {
      ...row,
      isin: fund.isin,
      fund_name: row.fund_name || fund.name,
    }
  } catch (error) {
    console.warn('[imports] fund resolution failed', {
      isin: row.isin,
      error: error instanceof Error ? error.message : 'Error desconocido.',
    })
    return row
  }
}

function isValidDetectedRow(row: NormalizedImportRow) {
  return validateDetectedRow(row).ok
}

function validateImportRowRecord(row: ImportRow) {
  return validateDetectedRow({
    isin: row.detected_isin,
    transaction_type: row.detected_transaction_type,
    trade_date: row.detected_trade_date,
    amount_eur: row.detected_amount,
    shares: row.detected_shares,
    nav: row.detected_nav,
  })
}

async function insertTransactionFromImportRow(importId: string, row: ImportRow): Promise<ImportTransactionResult> {
  const supabase = createServiceSupabaseClient()
  if (!row.detected_isin || !row.detected_transaction_type || !row.detected_trade_date || !row.detected_amount || !row.detected_shares) {
    return { rowId: row.id, status: 'invalid', error: 'Fila incompleta.' }
  }

  const [{ data: account }, fund] = await Promise.all([
    supabase.from('accounts').select('id').eq('active', true).order('created_at').limit(1).maybeSingle(),
    resolveFundByIsin(row.detected_isin),
  ])

  if (!account || !fund) {
    await supabase
      .from('import_rows')
      .update({ validation_status: 'invalid', validation_error: 'No se encontro cuenta activa o fondo por ISIN.' })
      .eq('id', row.id)
    return { rowId: row.id, status: 'invalid', error: 'No se encontro cuenta activa o fondo por ISIN.' }
  }

  const payload = {
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
  }

  const { data: existing, error: existingError } = await supabase
    .from('transactions')
    .select('id')
    .eq('raw_import_id', importId)
    .eq('account_id', payload.account_id)
    .eq('fund_id', payload.fund_id)
    .eq('transaction_type', payload.transaction_type)
    .eq('trade_date', payload.trade_date)
    .eq('amount_eur', payload.amount_eur)
    .eq('shares', payload.shares)
    .maybeSingle()

  if (existingError) {
    await supabase.from('import_rows').update({ validation_status: 'invalid', validation_error: existingError.message }).eq('id', row.id)
    return { rowId: row.id, status: 'invalid', error: existingError.message }
  }

  if (existing) {
    console.info('[imports] duplicate transaction skipped', { importId, rowId: row.id, transactionId: existing.id })
    return { rowId: row.id, status: 'duplicate', transactionId: existing.id }
  }

  const { data: transaction, error } = await supabase.from('transactions').insert(payload).select('id').single()

  if (error) {
    await supabase.from('import_rows').update({ validation_status: 'invalid', validation_error: error.message }).eq('id', row.id)
    return { rowId: row.id, status: 'invalid', error: error.message }
  }

  console.info('[imports] transaction created', { importId, rowId: row.id, transactionId: transaction.id })
  return { rowId: row.id, status: 'created', transactionId: transaction.id }
}

async function getImportRows(importId: string) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.from('import_rows').select('*').eq('import_id', importId)
  if (error) throw new Error(error.message)
  return data ?? []
}

async function updateImportStatus(importId: string) {
  const supabase = createServiceSupabaseClient()
  const rows = await getImportRows(importId)
  const accepted = rows.filter((row) => row.validation_status === 'accepted').length
  const rejected = rows.filter((row) => row.validation_status === 'rejected' || row.validation_status === 'invalid').length
  const status = accepted > 0 ? 'imported' : rows.some((row) => row.validation_status === 'valid') ? 'validated' : 'failed'

  await supabase
    .from('imports')
    .update({
      status,
      accepted_rows: accepted,
      rejected_rows: rejected,
      error_message: status === 'failed' ? 'No hay filas validas para importar.' : null,
    })
    .eq('id', importId)
}
