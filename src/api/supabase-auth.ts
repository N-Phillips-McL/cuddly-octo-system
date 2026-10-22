import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '../config/supabase-config'

// Session storage ends the host sign-in when the tab closes, which suits a shared presenting machine.
export const supabaseAuth: SupabaseClient | null = SUPABASE_CONFIG
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null
