import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import DeleteButton from "./delete-button"
import DownloadButton from "./download-button"

export default function DocumentationDetail({ documentation }: { documentation: any }) {
  if (!documentation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold">Documentation not found</h1>
        <p className="text-muted-foreground">
          The documentation you are looking for does not exist or has been deleted.
        </p>
        <Button asChild className="mt-4">
          <Link href="/documentation">Back to List</Link>
        </Button>
      </div>
    )
  }

  const createdAt = new Date(documentation.created_at).toLocaleString()
  const updatedAt = documentation.updated_at ? new Date(documentation.updated_at).toLocaleString() : createdAt

  // Parse sections if it exists
  let sections = {}
  try {
    if (documentation.sections && typeof documentation.sections === "string") {
      sections = JSON.parse(documentation.sections)
    } else if (documentation.sections && typeof documentation.sections === "object") {
      sections = documentation.sections
    }
  } catch (error) {
    console.error("Error parsing sections:", error)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{documentation.project_name}</CardTitle>
            <CardDescription>
              Type: {documentation.doc_type} • Created: {createdAt}
              {updatedAt !== createdAt && ` • Updated: ${updatedAt}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/documentation">Back to List</Link>
            </Button>
            <DeleteButton id={documentation.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Project Description</h3>
          <p className="text-muted-foreground">{documentation.project_description || "No description provided."}</p>
        </div>

        {(sections.designId || sections.codeId || documentation.project_id) && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Related Items</h3>
            <ul className="list-disc pl-5 space-y-1">
              {documentation.project_id && (
                <li>
                  <Link href={`/specifications/${documentation.project_id}`} className="text-blue-500 hover:underline">
                    View Specification
                  </Link>
                </li>
              )}
              {sections.designId && (
                <li>
                  <Link href={`/design/${sections.designId}`} className="text-blue-500 hover:underline">
                    View Design
                  </Link>
                </li>
              )}
              {sections.codeId && (
                <li>
                  <Link href={`/code-generation/${sections.codeId}`} className="text-blue-500 hover:underline">
                    View Generated Code
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-2">Documentation Content</h3>
          <div className="bg-muted p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
            {documentation.generated_docs}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="text-xs text-muted-foreground">Documentation ID: {documentation.id}</div>
        <DownloadButton id={documentation.id} documentation={documentation} />
      </CardFooter>
    </Card>
  )
}
