import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { Fund, LatestFundNav } from '@/lib/supabase/types'

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
