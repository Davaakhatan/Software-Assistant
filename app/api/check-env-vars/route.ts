import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasDeepseekKey: !!process.env.DEEPSEEK_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
  })
}
