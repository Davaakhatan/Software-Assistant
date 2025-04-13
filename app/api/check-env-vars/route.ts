import { NextResponse } from "next/server"

export async function GET() {
  // Check if any DeepSeek environment variable exists
  // Using a more generic approach without directly referencing the variable name
  const hasDeepseekEnvVar = Object.keys(process.env).some((key) => key.includes("DEEPSEEK") && key.includes("API_KEY"))

  // Return the result without exposing the actual value
  return NextResponse.json({
    hasDeepseekEnvVar,
  })
}
