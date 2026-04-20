import { NextResponse } from 'next/server'
import { deleteTransaction } from '@/lib/data/transactions'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const result = await deleteTransaction(id)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = getErrorMessage(error)
    const status = message.includes('No se encontro') ? 404 : 400
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo eliminar el movimiento.'
}
