import { createClient } from "@supabase/supabase-js"

// Create a singleton instance for server-side operations with admin privileges
let supabaseAdminInstance = null

export function getSupabaseAdmin() {
  if (supabaseAdminInstance) return supabaseAdminInstance

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables for admin access")
    throw new Error("Missing Supabase environment variables for admin access")
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdminInstance
}
