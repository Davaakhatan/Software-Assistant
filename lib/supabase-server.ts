import { createClient } from "@supabase/supabase-js"

// Create a singleton instance for server-side operations
let supabaseServerInstance = null

export function getSupabaseServer() {
  if (supabaseServerInstance) return supabaseServerInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    // Add connection pooling for better performance
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "sdlc-companion",
      },
    },
  })

  return supabaseServerInstance
}

// For backward compatibility
export const supabaseServer = getSupabaseServer()
