import { createClient } from "@supabase/supabase-js"

// Create a simple Supabase client for API routes that doesn't use cookies
export function createApiClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "sdlc-companion-api",
      },
    },
  })
}

// Export a pre-configured client for convenience
export const supabaseApi = {
  from: (table: string) => createApiClient().from(table),
  rpc: (fn: string, params?: any) => createApiClient().rpc(fn, params),
  storage: {
    from: (bucket: string) => createApiClient().storage.from(bucket),
  },
  auth: {
    getUser: () => createApiClient().auth.getUser(),
  },
}
