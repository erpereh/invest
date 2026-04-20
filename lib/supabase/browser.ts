import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    return null
  }

  return createClient<Database>(url, publishableKey)
}
