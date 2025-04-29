import { createClient } from "@supabase/supabase-js"

// Create a Supabase client specifically for API routes
// This doesn't use cookies and is suitable for server-side API routes
export const supabaseApi = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: {
    persistSession: false,
  },
})
