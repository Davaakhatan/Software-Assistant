export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  return "http://localhost:3000"
}

export function createApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${getBaseUrl()}${normalized}`
}
