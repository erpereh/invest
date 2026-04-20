import { NextResponse } from 'next/server'
import { createImportWithRows } from '@/lib/data/imports'
import { parseMovementsTextWithGroq } from '@/lib/services/groq'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = String(body.text ?? '').trim()
    if (!text) {
      return NextResponse.json({ ok: false, error: 'Falta el texto a importar.' }, { status: 400 })
    }

    const rows = await parseMovementsTextWithGroq(text)
    const result = await createImportWithRows({
      importType: 'text',
      sourceName: 'MyInvestor',
      rawText: text,
      rawJson: { parser: 'groq' },
      rows,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo procesar el texto.'
}
