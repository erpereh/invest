'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileSpreadsheet,
  Image,
  Keyboard,
  Loader2,
  Search,
  Upload,
  XCircle,
} from 'lucide-react'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'
import type { ImportJob, ImportRow } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

type ResolveStatus = 'idle' | 'loading' | 'found' | 'not_found' | 'error'

interface ResolvedFund {
  isin: string
  name: string
  management_company: string | null
}

interface UploadSummary {
  fileName: string
  detectedType: string
  rows: number
  valid: number
  invalid: number
}

export function ImportarPage({ data }: { data: PortfolioDashboardData }) {
  const [status, setStatus] = useState<string | null>(null)
  const [manualIsin, setManualIsin] = useState('')
  const [fundName, setFundName] = useState('')
  const [manager, setManager] = useState('')
  const [resolveStatus, setResolveStatus] = useState<ResolveStatus>('idle')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null)

  const latestImport = data.imports[0] ?? null
  const latestRows = latestImport ? data.importRows.filter((row) => row.import_id === latestImport.id) : []
  const latestSummary = latestImport ? buildImportSummary(latestImport, latestRows) : null

  useEffect(() => {
    const isin = manualIsin.trim().toUpperCase()
    if (isin.length < 12) {
      setResolveStatus('idle')
      return
    }

    let cancelled = false
    setResolveStatus('loading')
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/funds/resolve?isin=${encodeURIComponent(isin)}`)
        const result = await response.json()
        if (cancelled) return
        if (!response.ok || !result.ok) {
          setResolveStatus('error')
          return
        }
        if (!result.found) {
          setResolveStatus('not_found')
          return
        }
        const fund = result.fund as ResolvedFund
        setFundName((current) => current || fund.name)
        setManager(fund.management_company ?? '')
        setResolveStatus('found')
      } catch {
        if (!cancelled) setResolveStatus('error')
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [manualIsin])

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await postJson('/api/imports/manual', {
      rows: [
        {
          isin: manualIsin,
          fund_name: fundName,
          transaction_type: form.get('transaction_type'),
          trade_date: form.get('trade_date'),
          amount_eur: Number(form.get('amount_eur')),
          shares: Number(form.get('shares')),
          nav: form.get('nav') ? Number(form.get('nav')) : null,
          confidence: resolveStatus === 'found' ? 1 : 0.8,
        },
      ],
    })
  }

  async function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await postJson('/api/imports/text', { text: form.get('text') })
  }

  async function submitFile(event: FormEvent<HTMLFormElement>, endpoint: string) {
    event.preventDefault()
    setStatus('Procesando archivo...')
    const response = await fetch(endpoint, { method: 'POST', body: new FormData(event.currentTarget) })
    const result = await response.json()
    if (!response.ok || !result.ok) {
      setStatus(result.error ?? 'No se pudo procesar.')
      return
    }

    const rows = (result.rows ?? []) as ImportRow[]
    const valid = rows.filter((row) => row.validation_status === 'valid').length
    const invalid = rows.length - valid
    setUploadSummary({
      fileName: result.importJob?.original_filename ?? selectedFile ?? 'Archivo',
      detectedType: result.detectedFormat ?? result.importJob?.raw_json?.detected_format ?? 'CSV',
      rows: rows.length,
      valid,
      invalid,
    })
    setStatus('Importacion preparada. Revisa las filas detectadas antes de aceptar.')
    window.location.reload()
  }

  async function postJson(endpoint: string, body: unknown) {
    setStatus('Creando staging...')
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    if (!response.ok || !result.ok) {
      setStatus(result.error ?? 'No se pudo procesar.')
      return
    }
    setStatus('Staging creado. Recargando...')
    window.location.reload()
  }

  async function acceptImport(id: string, rowIds?: string[]) {
    setStatus('Aceptando filas validas...')
    const response = await fetch(`/api/imports/${id}/accept`, {
      method: 'POST',
      headers: rowIds ? { 'Content-Type': 'application/json' } : undefined,
      body: rowIds ? JSON.stringify({ rowIds }) : undefined,
    })
    const result = await response.json()
    setStatus(
      result.ok
        ? `Aceptadas: ${result.accepted}. Creadas: ${result.created}. Duplicadas: ${result.duplicates}. Invalidas: ${result.invalid}.`
        : result.error
    )
    if (result.ok) window.location.reload()
  }

  async function rejectImport(id: string, rowIds?: string[]) {
    setStatus('Rechazando filas...')
    const response = await fetch(`/api/imports/${id}/reject`, {
      method: 'POST',
      headers: rowIds ? { 'Content-Type': 'application/json' } : undefined,
      body: rowIds ? JSON.stringify({ rowIds }) : undefined,
    })
    const result = await response.json()
    setStatus(result.ok ? `Filas rechazadas: ${result.rejected}` : result.error)
    if (result.ok) window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-foreground">Importar movimientos</h1>
        <p className="text-sm text-muted-foreground">Sube ordenes de MyInvestor, revisa el staging y crea movimientos reales.</p>
      </div>

      {status ? <StatusMessage text={status} /> : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <section className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-5 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">CSV MyInvestor</p>
              <p className="text-sm text-foreground mt-1">Formato detectado: Fecha de la orden, ISIN, Importe estimado, Nº de participaciones, Estado.</p>
            </div>
            <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />
          </div>

          <form onSubmit={(event) => submitFile(event, '/api/imports/file')} className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Archivo CSV o Excel</span>
              <input
                name="file"
                required
                type="file"
                accept=".csv,.xlsx,.xls"
                className="input-like"
                onChange={(event) => setSelectedFile(event.currentTarget.files?.[0]?.name ?? null)}
              />
            </label>
            {selectedFile ? <p className="text-xs text-muted-foreground">Seleccionado: {selectedFile}</p> : null}
            <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Procesar archivo
            </button>
          </form>

          <ImportSummary summary={uploadSummary ?? latestSummary} />
        </section>

        <section className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-5 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Movimiento manual</p>
              <p className="text-sm text-muted-foreground mt-1">El nombre del fondo se resuelve automaticamente por ISIN.</p>
            </div>
            <Keyboard className="w-5 h-5 text-primary shrink-0" />
          </div>

          <form onSubmit={submitManual} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">ISIN</span>
              <div className="relative">
                <input
                  name="isin"
                  required
                  value={manualIsin}
                  onChange={(event) => {
                    setManualIsin(event.target.value.toUpperCase())
                    setFundName('')
                    setManager('')
                  }}
                  placeholder="IE000ZYRH0Q7"
                  className="input-like w-full pr-9"
                />
                <ResolveIcon status={resolveStatus} />
              </div>
              <ResolveHint status={resolveStatus} manager={manager} />
            </label>

            <label className="sm:col-span-2 flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Fondo</span>
              <input value={fundName} onChange={(event) => setFundName(event.target.value)} placeholder="Se autocompleta al resolver el ISIN" className="input-like" />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Tipo</span>
              <select name="transaction_type" required defaultValue="buy" className="input-like">
                <option value="buy">Compra</option>
                <option value="sell">Venta</option>
                <option value="transfer_in">Traspaso entrada</option>
                <option value="transfer_out">Traspaso salida</option>
                <option value="switch_in">Switch entrada</option>
                <option value="switch_out">Switch salida</option>
              </select>
            </label>

            <LabeledInput name="trade_date" label="Fecha" required type="date" />
            <LabeledInput name="amount_eur" label="Importe EUR" required type="number" step="0.000001" min="0" placeholder="600" />
            <LabeledInput name="shares" label="Participaciones" required type="number" step="0.0000000001" min="0" placeholder="56.98" />
            <LabeledInput name="nav" label="NAV opcional" type="number" step="0.00000001" min="0" placeholder="N/D" />
            <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">Crear staging</button>
          </form>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AiPanel icon={Keyboard} title="Texto con IA" onSubmit={submitText} />
        <ImagePanel onSubmit={(event) => submitFile(event, '/api/imports/image')} />
      </div>

      <ImportsTable data={data} onAccept={acceptImport} onReject={rejectImport} />
      <StagingTable rows={data.importRows} onAccept={acceptImport} onReject={rejectImport} />
    </div>
  )
}

function StatusMessage({ text }: { text: string }) {
  return <div className="bg-surface-2 border border-border/70 rounded-xl p-3 text-xs text-muted-foreground">{text}</div>
}

function ImportSummary({ summary }: { summary: UploadSummary | null }) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SummaryTile label="Tipo" value="Pendiente" />
        <SummaryTile label="Filas" value="0" />
        <SummaryTile label="Validas" value="0" />
        <SummaryTile label="Invalidas" value="0" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <SummaryTile label="Tipo" value={summary.detectedType} />
      <SummaryTile label="Filas" value={String(summary.rows)} />
      <SummaryTile label="Validas" value={String(summary.valid)} tone="gain" />
      <SummaryTile label="Invalidas" value={String(summary.invalid)} tone={summary.invalid > 0 ? 'loss' : undefined} />
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="rounded-xl bg-surface-2/70 border border-border/40 p-3">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-sm font-bold text-foreground truncate', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{value}</p>
    </div>
  )
}

function ResolveIcon({ status }: { status: ResolveStatus }) {
  const className = 'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4'
  if (status === 'loading') return <Loader2 className={cn(className, 'text-primary animate-spin')} />
  if (status === 'found') return <CheckCircle2 className={cn(className, 'text-gain')} />
  if (status === 'not_found' || status === 'error') return <AlertTriangle className={cn(className, 'text-loss')} />
  return <Search className={cn(className, 'text-muted-foreground')} />
}

function ResolveHint({ status, manager }: { status: ResolveStatus; manager: string }) {
  const text = {
    idle: 'Escribe un ISIN para resolver el fondo.',
    loading: 'Buscando fondo...',
    found: manager ? `Fondo encontrado. Gestora: ${manager}.` : 'Fondo encontrado.',
    not_found: 'No encontrado. Puedes completar el nombre manualmente.',
    error: 'No se pudo resolver ahora. Puedes continuar manualmente.',
  }[status]

  return <span className={cn('text-[11px]', status === 'found' ? 'text-gain' : status === 'not_found' || status === 'error' ? 'text-loss' : 'text-muted-foreground')}>{text}</span>
}

function LabeledInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input {...inputProps} className={cn('input-like', inputProps.className)} />
    </label>
  )
}

function AiPanel({ icon: Icon, title, onSubmit }: { icon: React.ElementType; title: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <textarea name="text" required placeholder="Pega aqui el texto copiado de MyInvestor..." className="input-like min-h-28" />
        <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">Extraer movimientos</button>
      </form>
    </section>
  )
}

function ImagePanel({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Imagen con IA</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="file" required type="file" accept="image/*" className="input-like" />
        <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">Extraer desde imagen</button>
      </form>
    </section>
  )
}

function ImportsTable({
  data,
  onAccept,
  onReject,
}: {
  data: PortfolioDashboardData
  onAccept: (id: string, rowIds?: string[]) => Promise<void>
  onReject: (id: string, rowIds?: string[]) => Promise<void>
}) {
  return (
    <section className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Importaciones recientes</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Staging: {data.diagnostics.validImportRows} validas pendientes, {data.diagnostics.invalidImportRows} invalidas o rechazadas.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[760px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Tipo</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Fuente</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Filas</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Estado</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Gestion</th>
            </tr>
          </thead>
          <tbody>
            {data.imports.length > 0 ? data.imports.map((item) => (
              <tr key={item.id} className="border-b border-border/20">
                <td className="py-3 text-muted-foreground">{new Date(item.created_at).toLocaleString('es-ES')}</td>
                <td className="py-3 text-foreground">{getImportTypeLabel(item)}</td>
                <td className="py-3 text-muted-foreground">{item.source_name}</td>
                <td className="py-3 text-right text-muted-foreground">{item.parsed_rows ?? 0}</td>
                <td className="py-3 text-right text-foreground">{getDisplayImportStatus(item.id, item.status, data.importRows)}</td>
                <td className="py-3 text-right">
                  <RowActions onAccept={() => onAccept(item.id)} onReject={() => onReject(item.id)} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">No hay importaciones todavia.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StagingTable({
  rows,
  onAccept,
  onReject,
}: {
  rows: ImportRow[]
  onAccept: (id: string, rowIds?: string[]) => Promise<void>
  onReject: (id: string, rowIds?: string[]) => Promise<void>
}) {
  return (
    <section className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Revision de staging</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[1120px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Fila</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">ISIN</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Fondo</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Tipo</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Importe</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Particip.</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">NAV</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Conf.</th>
              <th className="text-left pb-2.5 text-muted-foreground font-medium">Estado</th>
              <th className="text-right pb-2.5 text-muted-foreground font-medium">Accion</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row) => (
              <ImportRowItem key={row.id} row={row} onAccept={onAccept} onReject={onReject} />
            )) : (
              <tr>
                <td colSpan={11} className="py-10 text-center text-muted-foreground">No hay filas de staging.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ImportRowItem({
  row,
  onAccept,
  onReject,
}: {
  row: ImportRow
  onAccept: (id: string, rowIds?: string[]) => Promise<void>
  onReject: (id: string, rowIds?: string[]) => Promise<void>
}) {
  return (
    <tr className="border-b border-border/20">
      <td className="py-3 text-muted-foreground">#{row.row_index}</td>
      <td className="py-3 text-muted-foreground">{row.detected_trade_date ?? 'N/D'}</td>
      <td className="py-3 font-semibold text-foreground">{row.detected_isin ?? 'N/D'}</td>
      <td className="py-3 text-muted-foreground max-w-[260px] truncate">{row.detected_fund_name ?? 'N/D'}</td>
      <td className="py-3 text-muted-foreground">{row.detected_transaction_type ?? 'N/D'}</td>
      <td className="py-3 text-right text-muted-foreground">{formatNumber(row.detected_amount)}</td>
      <td className="py-3 text-right text-muted-foreground">{formatNumber(row.detected_shares, 4)}</td>
      <td className="py-3 text-right text-muted-foreground">{formatNumber(row.detected_nav, 4)}</td>
      <td className="py-3 text-right text-muted-foreground">{row.confidence != null ? `${Math.round(Number(row.confidence) * 100)}%` : 'N/D'}</td>
      <td className="py-3">
        <div className="flex flex-col gap-1">
          <StatusPill status={row.validation_status} />
          {row.validation_error ? <span className="text-[10px] text-loss max-w-[280px]">{row.validation_error}</span> : null}
        </div>
      </td>
      <td className="py-3 text-right">
        <RowActions onAccept={() => onAccept(row.import_id, [row.id])} onReject={() => onReject(row.import_id, [row.id])} />
      </td>
    </tr>
  )
}

function RowActions({ onAccept, onReject }: { onAccept: () => void; onReject: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={onAccept} className="p-1.5 rounded-lg bg-gain-muted text-gain" aria-label="Aceptar">
        <CheckCircle2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={onReject} className="p-1.5 rounded-lg bg-loss-muted text-loss" aria-label="Rechazar">
        <XCircle className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase',
        status === 'valid' && 'bg-blue-muted text-blue-accent',
        status === 'accepted' && 'bg-gain-muted text-gain',
        (status === 'invalid' || status === 'rejected') && 'bg-loss-muted text-loss',
        !['valid', 'accepted', 'invalid', 'rejected'].includes(status) && 'bg-surface-2 text-muted-foreground'
      )}
    >
      {status === 'valid' ? <CircleDashed className="w-3 h-3" /> : null}
      {status}
    </span>
  )
}

function getDisplayImportStatus(importId: string, storedStatus: string, rows: ImportRow[]) {
  const ownRows = rows.filter((row) => row.import_id === importId)
  if (ownRows.length === 0) return storedStatus
  if (ownRows.some((row) => row.validation_status === 'accepted')) return 'imported'
  if (ownRows.some((row) => row.validation_status === 'valid')) return 'parsed'
  if (ownRows.every((row) => row.validation_status === 'invalid' || row.validation_status === 'rejected')) return 'failed'
  return storedStatus
}

function buildImportSummary(importJob: ImportJob, rows: ImportRow[]): UploadSummary {
  const valid = rows.filter((row) => row.validation_status === 'valid').length
  const accepted = rows.filter((row) => row.validation_status === 'accepted').length
  const invalid = rows.length - valid - accepted
  return {
    fileName: importJob.original_filename ?? importJob.source_name,
    detectedType: getImportTypeLabel(importJob),
    rows: rows.length || importJob.parsed_rows || 0,
    valid: valid + accepted,
    invalid,
  }
}

function getImportTypeLabel(importJob: ImportJob) {
  const rawJson = importJob.raw_json
  if (rawJson && typeof rawJson === 'object' && !Array.isArray(rawJson) && 'detected_format' in rawJson) {
    return String(rawJson.detected_format)
  }
  return importJob.import_type
}

function formatNumber(value: number | null, digits = 2) {
  if (value == null) return 'N/D'
  return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits })
}
