import { NextResponse } from 'next/server'
import { createImportWithRows } from '@/lib/data/imports'
import { parseManualRows } from '@/lib/services/import-parsers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rows = parseManualRows(body.rows ?? [body])
    const result = await createImportWithRows({
      importType: 'manual',
      sourceName: 'manual',
      rawJson: { source: 'manual_form' },
      rows,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo crear la importacion manual.'
}
