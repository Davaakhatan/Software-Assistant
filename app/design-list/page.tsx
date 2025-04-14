import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import MermaidDiagram from "@/components/mermaid-diagram"
import { getSupabase } from "@/lib/supabase"

export async function getDesigns() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("designs")
      .select("*, requirements(project_name, specification_id, specifications(app_name))")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching designs:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getDesigns:", error)
    return { success: false, error: "Failed to fetch designs" }
  }
}

export default async function DesignsList() {
  const { data: designs, success } = await getDesigns()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/design">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Design
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Designs</h1>
        <p className="text-muted-foreground">View and manage your system designs</p>
      </div>

      {success && designs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <Card key={design.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>
                  {design.project_name ||
                    design.requirements?.project_name ||
                    design.requirements?.specifications?.app_name ||
                    "Unknown App"}
                </CardTitle>
                <CardDescription>
                  {design.type === "architecture"
                    ? "System Architecture"
                    : design.type === "data-model"
                      ? "Data Model"
                      : "Component Diagram"}
                  <br />
                  Created on {formatDate(design.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="border rounded-md p-4 bg-white">
                  <MermaidDiagram code={design.diagram_code} className="h-[150px] overflow-hidden" />
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/design/${design.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No designs found</p>
            <Link href="/design">
              <Button>Create Design</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
