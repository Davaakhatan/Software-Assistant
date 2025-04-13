import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"
import { getDesignById } from "../actions"
import { formatDate } from "@/lib/utils"
import MermaidDiagram from "@/components/mermaid-diagram"
import DeleteDesignButtonClient from "./delete-button-client"
import { Suspense } from "react"

export default async function DesignDetails({ params }) {
  const { data: design, success, error } = await getDesignById(params.id)

  if (!success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link href="/design-list">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Designs
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{error || "Design not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use the project_name property we added, or default to "Unknown Project"
  const projectName = design.project_name || "Unknown Project"

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/design-list">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Designs
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/design/edit/${params.id}`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Suspense
            fallback={
              <Button variant="destructive" disabled>
                Delete
              </Button>
            }
          >
            <DeleteDesignButtonClient id={params.id} />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {design.type === "architecture"
            ? "System Architecture"
            : design.type === "data-model"
              ? "Data Model"
              : "Component Diagram"}
        </h1>
        <div className="flex flex-col md:flex-row gap-2 text-muted-foreground">
          <p>Created on {formatDate(design.created_at)}</p>
          <span className="hidden md:inline">•</span>
          <p>Project: {projectName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagram</CardTitle>
          <CardDescription>
            {design.type === "architecture"
              ? "System architecture diagram showing the components and their interactions"
              : design.type === "data-model"
                ? "Data model diagram showing entities and their relationships"
                : "Component diagram showing how components interact with each other"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <MermaidDiagram code={design.diagram_code} className="w-full" />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Diagram Code</h3>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-sm font-mono">
              {design.diagram_code}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Link href="/code-generation">
          <Button className="gap-2">Continue to Code Generation</Button>
        </Link>
      </div>
    </div>
  )
}
