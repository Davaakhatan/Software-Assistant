/**
 * Utility functions for handling API URLs across different environments
 */

// Get the base URL for API requests based on the current environment
export function getBaseUrl(): string {
  // Check for environment variables first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // For client-side code, use the window location
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol
    const host = window.location.host
    return `${protocol}//${host}`
  }

  // For server-side code in production (Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Default fallback for development
  return "http://localhost:3000"
}

// Create a full API URL with proper error handling
export function createApiUrl(path: string): string {
  try {
    // Ensure path starts with a slash
    const normalizedPath = path.startsWith("/") ? path : `/${path}`

    // Get the base URL
    const baseUrl = getBaseUrl()

    // Combine them safely
    return `${baseUrl}${normalizedPath}`
  } catch (error) {
    console.error("Error creating API URL:", error)

    // Fallback to a simple string concatenation that should work in all environments
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000")

    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
  }
}

// Make a fetch request with proper URL handling
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Try to create a proper URL
    const url = createApiUrl(path)
    return await fetch(url, options)
  } catch (error) {
    console.error("Error in apiFetch:", error)

    // Fallback approach - direct string concatenation
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000")

    const fallbackUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
    return await fetch(fallbackUrl, options)
  }
}
