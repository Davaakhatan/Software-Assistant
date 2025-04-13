import { createClient } from "@supabase/supabase-js"

// Create a singleton instance for server-side operations
let supabaseServerInstance = null

export function getSupabaseServer() {
  if (supabaseServerInstance) return supabaseServerInstance

  // Server can access all environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables on server")
    throw new Error("Missing Supabase environment variables on server")
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseKey)
  return supabaseServerInstance
}

// For backward compatibility
// This is a safer approach that won't throw during module initialization
export const supabaseServer = {
  from: (...args) => getSupabaseServer().from(...args),
  rpc: (...args) => getSupabaseServer().rpc(...args),
  auth: {
    getUser: (...args) => getSupabaseServer().auth.getUser(...args),
    getSession: (...args) => getSupabaseServer().auth.getSession(...args),
  },
  storage: {
    from: (...args) => getSupabaseServer().storage.from(...args),
  },
  // Add other commonly used methods as needed
}
