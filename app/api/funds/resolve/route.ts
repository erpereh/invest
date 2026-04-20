import { NextResponse } from 'next/server'
import { resolveFundByIsin } from '@/lib/data/funds'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const isin = url.searchParams.get('isin')?.trim()
  if (!isin) {
    return NextResponse.json({ ok: false, error: 'Falta el ISIN.' }, { status: 400 })
  }

  try {
    const fund = await resolveFundByIsin(isin)
    if (!fund) {
      return NextResponse.json({ ok: true, found: false, isin: isin.toUpperCase() })
    }

    return NextResponse.json({
      ok: true,
      found: true,
      fund: {
        id: fund.id,
        isin: fund.isin,
        name: fund.name,
        management_company: fund.management_company,
        currency: fund.currency,
        region: fund.region,
        category: fund.category,
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo resolver el fondo por ISIN.'
}
