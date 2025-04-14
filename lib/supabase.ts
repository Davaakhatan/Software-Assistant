import { createClient } from "@supabase/supabase-js"

// Create a singleton instance for the browser
let supabaseInstance = null

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance

  // Client-side can only access NEXT_PUBLIC_ variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "sdlc-supabase-auth",
    },
    global: {
      headers: {
        "x-application-name": "sdlc-companion",
      },
    },
  })

  return supabaseInstance
}

// For backward compatibility
// This is a safer approach that won't throw during module initialization
export const supabase = {
  from: (...args) => getSupabase().from(...args),
  auth: {
    getUser: (...args) => getSupabase().auth.getUser(...args),
    getSession: (...args) => getSupabase().auth.getSession(...args),
    signInWithPassword: (...args) => getSupabase().auth.signInWithPassword(...args),
    signOut: (...args) => getSupabase().auth.signOut(...args),
    onAuthStateChange: (...args) => getSupabase().auth.onAuthStateChange(...args),
  },
  storage: {
    from: (...args) => getSupabase().storage.from(...args),
  },
  // Add other commonly used methods as needed
}
