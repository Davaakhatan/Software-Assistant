"use server";

import { createClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/supabase-js";

const cookieOptions: CookieOptions = {
  name: "sb-auth-token",
  domain: process.env.NEXT_PUBLIC_DOMAIN,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

// Creates a server-side Supabase client with cookie-based auth
export function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      storage: cookieOptions,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "sdlc-companion",
      },
    },
  });
}

// Backwards-compatible helper for route handlers
export async function createServerClient(cookieStore?: { get: (name: string) => Cookie | undefined }) {
  return getSupabaseServer();
}

// Dummy export for type compatibility in frontend imports
export const supabaseServer = null;
