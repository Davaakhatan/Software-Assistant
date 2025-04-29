import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Create a server-side Supabase client
export function getSupabaseServer() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey, {
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
}

// For backward compatibility
export const supabaseServer = getSupabaseServer()

// Export createServerClient for use in server actions
export const createServerClient = getSupabaseServer
