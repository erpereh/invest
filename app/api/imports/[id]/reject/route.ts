import { NextResponse } from 'next/server'
import { rejectImportRows } from '@/lib/data/imports'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await safeJson(request)
    const result = await rejectImportRows(id, body.rowIds)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo rechazar la importacion.'
}
