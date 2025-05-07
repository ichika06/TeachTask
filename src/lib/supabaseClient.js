// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase Client (using anon key)
const supabaseUrl = "https://ckwdowynrurrqbrawkxb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd2Rvd3lucnVycnFicmF3a3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTAwNjEsImV4cCI6MjA2MDk2NjA2MX0.7fy2cgdFPJIwD9S4cSqlalb-wv7qKFC0Kt8SNMRnKkI";

export const supabase = createClient(supabaseUrl, supabaseKey)

// Server-side Supabase Client (using service role key)
export function createServerSupabaseClient(token) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}
