// lib/api-utils.ts

/**
 * Utility functions for handling API URLs across different environments
 */

// Get the base URL for API requests based on the current environment
export function getBaseUrl(): string {
  // 1) In the browser, trust the current origin
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // 2) On Vercel (or similar), use the injected VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3) Explicit override (works in any Node env, including self-hosted)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // 4) Fallback for local development
  return "http://localhost:3000"
}

// Create a full API URL
export function createApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const base = getBaseUrl()
  const full = `${base}${normalized}`
  console.debug("[api-utils] createApiUrl:", full)
  return full
}

// A wrapper around fetch that always uses the absolute URL
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = createApiUrl(path)
  try {
    return await fetch(url, options)
  } catch (err) {
    console.error("[api-utils] fetch failed, URL was:", url, err)
    throw err
  }
}
