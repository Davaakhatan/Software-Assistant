import { getDesigns } from "@/app/design/actions"
import CodeGenerationForm from "./code-generation-form"
import { getSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CodeGenerationPage() {
  // Get a fresh Supabase server client
  const supabase = getSupabaseServer()

  // Fetch specifications directly from the database to ensure we have the latest data
  const { data: specifications, error: specError } = await supabase
    .from("specifications")
    .select("*")
    .order("created_at", { ascending: false })

  if (specError) {
    console.error("Error fetching specifications:", specError)
  }

  // Fetch designs
  const designsResult = await getDesigns()
  const designs = designsResult.success ? designsResult.data : []

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Code Generation</h1>
      <CodeGenerationForm specifications={specifications || []} designs={designs} />
    </div>
  )
}
