import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { Fund, LatestFundNav } from '@/lib/supabase/types'
import { normalizeIsin } from '@/lib/data/format'
import { fetchFundMetadataByIsin } from '@/lib/services/nav'

export async function getActiveFunds() {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.from('funds').select('*').eq('active', true).order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getLatestNavs() {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.from('latest_fund_nav').select('*').order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export function attachLatestNav(funds: Fund[], navs: LatestFundNav[]) {
  const navByFund = new Map(navs.map((nav) => [nav.fund_id, nav]))
  return funds.map((fund) => ({
    ...fund,
    latestNav: navByFund.get(fund.id) ?? null,
  }))
}

export async function resolveFundByIsin(isin: string) {
  const normalized = normalizeIsin(isin)
  const supabase = createServiceSupabaseClient()
  const { data: existing, error: existingError } = await supabase.from('funds').select('*').eq('isin', normalized).maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existing) return existing

  const metadata = await fetchFundMetadataByIsin(normalized)
  if (metadata.sourceStatus === 'unsupported' || !metadata.name) return null

  const { data, error } = await supabase
    .from('funds')
    .upsert(
      {
        isin: normalized,
        name: metadata.name,
        management_company: metadata.managementCompany ?? null,
        currency: metadata.currency ?? 'EUR',
        asset_class: 'equity',
        region: metadata.region ?? null,
        category: metadata.category ?? null,
        active: true,
        metadata: {
          resolved_from: metadata.provider,
          resolved_at: new Date().toISOString(),
          official_url: metadata.officialUrl,
          raw: metadata.rawPayload,
        },
      },
      { onConflict: 'isin' }
    )
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}
