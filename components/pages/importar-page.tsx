'use client'

import { FormEvent, useState } from 'react'
import { FileSpreadsheet, Image, Keyboard, Upload, CheckCircle2, XCircle } from 'lucide-react'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'

export function ImportarPage({ data }: { data: PortfolioDashboardData }) {
  const [status, setStatus] = useState<string | null>(null)

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await postJson('/api/imports/manual', {
      rows: [
        {
          isin: form.get('isin'),
          fund_name: form.get('fund_name'),
          transaction_type: form.get('transaction_type'),
          trade_date: form.get('trade_date'),
          amount_eur: Number(form.get('amount_eur')),
          shares: Number(form.get('shares')),
          nav: form.get('nav') ? Number(form.get('nav')) : null,
          confidence: 1,
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
    setStatus('Procesando...')
    const response = await fetch(endpoint, { method: 'POST', body: new FormData(event.currentTarget) })
    const result = await response.json()
    if (!response.ok || !result.ok) {
      setStatus(result.error ?? 'No se pudo procesar.')
      return
    }
    setStatus('Importacion creada. Recargando...')
    window.location.reload()
  }

  async function postJson(endpoint: string, body: unknown) {
    setStatus('Procesando...')
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
    setStatus('Importacion creada. Recargando...')
    window.location.reload()
  }

  async function acceptImport(id: string) {
    setStatus('Aceptando filas validas...')
    const response = await fetch(`/api/imports/${id}/accept`, { method: 'POST' })
    const result = await response.json()
    setStatus(result.ok ? `Filas aceptadas: ${result.accepted}` : result.error)
    if (result.ok) window.location.reload()
  }

  async function rejectImport(id: string) {
    setStatus('Rechazando filas...')
    const response = await fetch(`/api/imports/${id}/reject`, { method: 'POST' })
    const result = await response.json()
    setStatus(result.ok ? `Filas rechazadas: ${result.rejected}` : result.error)
    if (result.ok) window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Importar movimientos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Staging seguro antes de crear transacciones reales</p>
      </div>

      {status ? <div className="bg-surface-2 border border-border/70 rounded-xl p-3 text-xs text-muted-foreground">{status}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel icon={Keyboard} title="Movimiento manual">
          <form onSubmit={submitManual} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="isin" required placeholder="ISIN" className="input-like" />
            <input name="fund_name" placeholder="Nombre del fondo" className="input-like" />
            <select name="transaction_type" required className="input-like">
              <option value="buy">Compra</option>
              <option value="sell">Venta</option>
              <option value="transfer_in">Traspaso entrada</option>
              <option value="transfer_out">Traspaso salida</option>
              <option value="switch_in">Switch entrada</option>
              <option value="switch_out">Switch salida</option>
            </select>
            <input name="trade_date" required type="date" className="input-like" />
            <input name="amount_eur" required type="number" step="0.000001" min="0" placeholder="Importe EUR" className="input-like" />
            <input name="shares" required type="number" step="0.0000000001" min="0" placeholder="Participaciones" className="input-like" />
            <input name="nav" type="number" step="0.00000001" min="0" placeholder="NAV" className="input-like" />
            <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">Crear staging</button>
          </form>
        </Panel>

        <Panel icon={FileSpreadsheet} title="CSV o Excel de MyInvestor">
          <form onSubmit={(event) => submitFile(event, '/api/imports/file')} className="flex flex-col gap-3">
            <input name="file" required type="file" accept=".csv,.xlsx,.xls" className="input-like" />
            <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Subir archivo
            </button>
          </form>
        </Panel>

        <Panel icon={Keyboard} title="Texto con IA">
          <form onSubmit={submitText} className="flex flex-col gap-3">
            <textarea name="text" required placeholder="Pega aqui el texto copiado de MyInvestor..." className="input-like min-h-32" />
            <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">Extraer con Groq</button>
          </form>
        </Panel>

        <Panel icon={Image} title="Imagen con IA">
          <form onSubmit={(event) => submitFile(event, '/api/imports/image')} className="flex flex-col gap-3">
            <input name="file" required type="file" accept="image/*" className="input-like" />
            <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">Extraer desde imagen</button>
          </form>
        </Panel>
      </div>

      <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Importaciones recientes</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
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
                  <td className="py-3 text-foreground">{item.import_type}</td>
                  <td className="py-3 text-muted-foreground">{item.source_name}</td>
                  <td className="py-3 text-right text-muted-foreground">{item.parsed_rows ?? 0}</td>
                  <td className="py-3 text-right text-foreground">{item.status}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => acceptImport(item.id)} className="p-1.5 rounded-lg bg-gain-muted text-gain" aria-label="Aceptar filas">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => rejectImport(item.id)} className="p-1.5 rounded-lg bg-loss-muted text-loss" aria-label="Rechazar filas">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
      </div>
    </div>
  )
}

function Panel({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  )
}
