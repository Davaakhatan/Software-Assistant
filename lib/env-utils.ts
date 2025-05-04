/**
 * Utility functions for environment detection
 */

// Check if we're running in a production environment
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

// Check if we're running on Vercel
export function isVercel(): boolean {
  return !!process.env.VERCEL
}

// Get the current environment name
export function getEnvironment(): string {
  if (isVercel()) {
    return process.env.VERCEL_ENV || "production"
  }
  return process.env.NODE_ENV || "development"
}

// Log environment information for debugging
export function logEnvironmentInfo(): void {
  console.log("Environment:", getEnvironment())
  console.log("Is Production:", isProduction())
  console.log("Is Vercel:", isVercel())
  console.log("VERCEL_URL:", process.env.VERCEL_URL)
  console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL)
}
