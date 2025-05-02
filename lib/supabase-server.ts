import { createClient } from "@supabase/supabase-js"
import type { CookieOptions } from "@supabase/supabase-js"

const cookieOptions: CookieOptions = {
  name: "sb-auth-token",
  domain: process.env.NEXT_PUBLIC_DOMAIN,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
}

// Create a server-side Supabase client
export function getSupabaseServer() {
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

// For backward compatibility, we'll export this function that can be used
// in route handlers
export async function createServerClient(cookieStore?: { get: (name: string) => Cookie | undefined }) {
  return getSupabaseServer()
}

// Export a dummy client for type compatibility
export const supabaseServer = null
