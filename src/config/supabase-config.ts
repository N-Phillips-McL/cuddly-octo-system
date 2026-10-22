export interface SupabaseConfig {
  url: string
  publishableKey: string
}

const PROJECT_URL = /^https:\/\/[a-z0-9]+\.supabase\.co$/

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined
}

// import.meta.env also holds booleans (DEV, PROD), so values are read as unknown.
export function readSupabaseConfig(env: Record<string, unknown>): SupabaseConfig | null {
  const url = text(env.VITE_SUPABASE_URL)?.replace(/\/+$/, '')
  const publishableKey = text(env.VITE_SUPABASE_PUBLISHABLE_KEY)
  if (publishableKey && !publishableKey.startsWith('sb_publishable_')) {
    throw new Error('Use the publishable key (sb_publishable_...) in the page; no other key type belongs there.')
  }
  if (!url || !publishableKey || !PROJECT_URL.test(url)) {
    return null
  }
  return { url, publishableKey }
}

export const SUPABASE_CONFIG = readSupabaseConfig(import.meta.env)
