import { NextResponse } from 'next/server'
import { createTransaction } from '@/lib/data/transactions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const transaction = await createTransaction(body)
    return NextResponse.json({ ok: true, transaction })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo crear la transaccion.'
}
