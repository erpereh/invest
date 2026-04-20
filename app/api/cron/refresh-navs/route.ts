import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/env'
import { refreshNavs } from '@/lib/services/nav'

export async function POST(request: Request) {
  const cronSecret = getEnv('CRON_SECRET')
  if (cronSecret) {
    const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (provided !== cronSecret) {
      return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })
    }
  }

  try {
    const result = await refreshNavs()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudieron refrescar los NAVs.'
}
