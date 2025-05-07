// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase Client (using anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
