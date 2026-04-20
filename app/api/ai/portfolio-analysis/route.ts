import { NextResponse } from 'next/server'
import { getPortfolioDashboardData } from '@/lib/data/portfolio'
import { generatePortfolioAnalysis } from '@/lib/services/groq'

export async function POST() {
  try {
    const data = await getPortfolioDashboardData()
    const analysis = await generatePortfolioAnalysis({
      summary: data.summary,
      holdings: data.holdings,
      distribution: data.groupedDistribution,
      latestNavs: data.latestNavs,
    })
    return NextResponse.json({ ok: true, analysis })
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 })
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo generar el analisis.'
}
