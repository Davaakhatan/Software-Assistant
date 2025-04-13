import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
