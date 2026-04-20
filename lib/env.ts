export function getEnv(name: string) {
  const value = process.env[name]
  return value && value.trim().length > 0 ? value : undefined
}

export function requireServerEnv(name: string) {
  const value = getEnv(name)
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`)
  }
  return value
}

export function hasSupabaseServerEnv() {
  return Boolean(getEnv('NEXT_PUBLIC_SUPABASE_URL') && getEnv('SUPABASE_SERVICE_ROLE_KEY'))
}

export function hasGroqEnv() {
  return Boolean(getEnv('GROQ_API_KEY'))
}
