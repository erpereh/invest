import { NextResponse } from 'next/server'
import { createImportWithRows } from '@/lib/data/imports'
import { parseMovementsImageWithGroq } from '@/lib/services/groq'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Falta la imagen.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const imageDataUrl = `data:${file.type || 'image/png'};base64,${buffer.toString('base64')}`
    const rows = await parseMovementsImageWithGroq(imageDataUrl)
    const result = await createImportWithRows({
      importType: 'image',
      sourceName: 'MyInvestor',
      originalFilename: file.name,
      rawJson: { file_name: file.name, file_size: file.size, parser: 'groq_vision' },
      rows,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo procesar la imagen.'
}
