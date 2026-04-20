import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv, requireServerEnv } from '@/lib/env'

let serviceClient: SupabaseClient | null = null

export function createServiceSupabaseClient() {
  const url = requireServerEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (!serviceClient) {
    serviceClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return serviceClient
}

export function maybeCreateServiceSupabaseClient() {
  if (!getEnv('NEXT_PUBLIC_SUPABASE_URL') || !getEnv('SUPABASE_SERVICE_ROLE_KEY')) {
    return null
  }

  return createServiceSupabaseClient()
}
