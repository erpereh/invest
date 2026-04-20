import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { recalculateHoldings } from '@/lib/services/holdings'

export interface NavQuote {
  isin: string
  navDate: string
  nav: number
  currency: string
  source: string
  rawPayload: Record<string, unknown>
}

export interface NavProvider {
  fetchLatestNavByIsin(isin: string): Promise<NavQuote | null>
}

class NotConfiguredNavProvider implements NavProvider {
  async fetchLatestNavByIsin() {
    return null
  }
}

export const navProvider: NavProvider = new NotConfiguredNavProvider()

export async function refreshNavs() {
  const supabase = createServiceSupabaseClient()
  const { data: funds, error } = await supabase.from('funds').select('*').eq('active', true).order('name')
  if (error) throw new Error(error.message)

  const inserted = []
  const missing = []

  for (const fund of funds ?? []) {
    const quote = await navProvider.fetchLatestNavByIsin(fund.isin)
    if (!quote) {
      missing.push(fund.isin)
      continue
    }

    const { error: navError } = await supabase.from('fund_navs').upsert(
      {
        fund_id: fund.id,
        nav_date: quote.navDate,
        nav: quote.nav,
        currency: quote.currency,
        source: quote.source,
        raw_payload: quote.rawPayload,
      },
      { onConflict: 'fund_id,nav_date' }
    )

    if (navError) throw new Error(navError.message)
    inserted.push(quote.isin)
  }

  const recalculation = inserted.length > 0 ? await recalculateHoldings() : null

  return {
    refreshed: inserted.length,
    missing,
    recalculation,
    note:
      inserted.length === 0
        ? 'No hay proveedor NAV externo configurado todavia. Conecta fetchLatestNavByIsin en lib/services/nav.ts.'
        : undefined,
  }
}
