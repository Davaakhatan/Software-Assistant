import { getSupabaseServer } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import DocumentationDetail from "./documentation-detail"

export const dynamic = "force-dynamic"

export default async function DocumentationPage({ params }: { params: { id: string } }) {
  const { id } = params

  console.log("Fetching documentation with ID:", id)

  // Fetch the documentation directly
  const supabase = getSupabaseServer()
  const { data, error } = await supabase.from("documentations").select("*").eq("id", id).limit(1)

  if (error) {
    console.error("Error fetching documentation:", error)
    notFound()
  }

  if (!data || data.length === 0) {
    console.error("Documentation not found with ID:", id)
    notFound()
  }

  console.log("Documentation found:", data[0].id)

  return <DocumentationDetail documentation={data[0]} />
}
