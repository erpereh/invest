import { NextResponse } from 'next/server'
import { createImportWithRows } from '@/lib/data/imports'
import { parseCsv, parseExcel } from '@/lib/services/import-parsers'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Falta el archivo.' }, { status: 400 })
    }

    const lowerName = file.name.toLowerCase()
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
    const isCsv = lowerName.endsWith('.csv')
    if (!isExcel && !isCsv) {
      return NextResponse.json({ ok: false, error: 'Formato no soportado. Usa CSV o Excel.' }, { status: 400 })
    }

    const rows = isExcel ? parseExcel(await file.arrayBuffer()) : parseCsv(await file.text())
    const detectedFormat = rows.some((row) => row.source_format === 'myinvestor_orders_csv')
      ? 'MyInvestor CSV'
      : isExcel
        ? 'Excel'
        : 'CSV'
    const result = await createImportWithRows({
      importType: isExcel ? 'excel' : 'csv',
      sourceName: 'MyInvestor',
      originalFilename: file.name,
      rawJson: { file_name: file.name, file_size: file.size, detected_format: detectedFormat },
      rows,
    })

    return NextResponse.json({ ok: true, detectedFormat, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo procesar el archivo.'
}
