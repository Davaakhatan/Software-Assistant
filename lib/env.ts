// Environment variables
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Feature flags
export const IS_PRODUCTION = process.env.NODE_ENV === "production"
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development"
export const IS_TEST = process.env.NODE_ENV === "test"

// Check if required environment variables are set
export function checkRequiredEnvVars() {
  const missingVars = []

  if (!SUPABASE_URL) missingVars.push("SUPABASE_URL")
  if (!SUPABASE_ANON_KEY) missingVars.push("SUPABASE_ANON_KEY")

  if (missingVars.length > 0) {
    console.warn(`Missing required environment variables: ${missingVars.join(", ")}`)
    return false
  }

  return true
}
