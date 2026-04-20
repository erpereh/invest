import { NextResponse } from 'next/server'
import { getImportRowsByImportId } from '@/lib/data/imports'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const rows = await getImportRowsByImportId(id)
    return NextResponse.json({ ok: true, rows })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudieron cargar las filas del import.'
}
