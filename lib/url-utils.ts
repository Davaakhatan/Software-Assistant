// lib/url-utils.ts

/**
 * Determine the base URL for your app, in both browser and server (Vercel/self-hosted).
 */
export function getBaseUrl(): string {
  // 1) Browser runtime
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // 2) Server on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3) Explicit override
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 4) Fallback for local dev
  return "http://localhost:3000";
}

/**
 * Build a fully-qualified API URL from a path like "/api/…"
 */
export function createApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalized}`;
}
