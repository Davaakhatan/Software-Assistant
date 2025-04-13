import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDesignById, getRequirementsList } from "../../actions"
import EditDesignForm from "./edit-form"

export default async function EditDesign({ params }) {
  const { data: design, success, error } = await getDesignById(params.id)
  const requirementsResult = await getRequirementsList()

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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Link href={`/design/${params.id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Design
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Design</h1>
        <p className="text-muted-foreground">
          Update your{" "}
          {design.type === "architecture"
            ? "system architecture"
            : design.type === "data-model"
              ? "data model"
              : "component diagram"}
        </p>
      </div>

      <EditDesignForm design={design} requirements={requirementsResult.success ? requirementsResult.data : []} />
    </div>
  )
}
