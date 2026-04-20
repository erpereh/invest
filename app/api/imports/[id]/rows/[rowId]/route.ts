import { NextResponse } from 'next/server'
import { updateImportRow } from '@/lib/data/imports'

export async function PATCH(request: Request, context: { params: Promise<{ id: string; rowId: string }> }) {
  try {
    const { id, rowId } = await context.params
    const body = await request.json()
    const row = await updateImportRow(id, rowId, {
      isin: body.isin ?? null,
      fund_name: body.fund_name ?? null,
      transaction_type: body.transaction_type ?? null,
      trade_date: body.trade_date ?? null,
      amount_eur: body.amount_eur == null || body.amount_eur === '' ? null : Number(body.amount_eur),
      shares: body.shares == null || body.shares === '' ? null : Number(body.shares),
      nav: body.nav == null || body.nav === '' ? null : Number(body.nav),
    })
    return NextResponse.json({ ok: true, row })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo actualizar la fila del import.'
}
