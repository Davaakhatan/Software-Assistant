import { getGeneratedCode } from "@/app/code-generation/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft, Code, FileCode } from "lucide-react"

export default async function SavedCodePage() {
  const { success, data, error } = await getGeneratedCode()

  if (!success) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-6">
          <Link href="/code-generation">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Saved Code Generations</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error fetching generated code: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-6">
          <Link href="/code-generation">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Saved Code Generations</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>No saved code generations found. Generate some code first!</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Link href="/code-generation">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Saved Code Generations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => {
          // Safely extract requirements and truncate if it exists
          const requirements = item.requirements || ""
          const truncatedRequirements =
            requirements.length > 100 ? requirements.substring(0, 100) + "..." : requirements

          // Safely get app name from specifications
          const appName = item.specifications?.app_name || "N/A"

          // Safely get design type
          const designType = item.designs?.type || "N/A"

          return (
            <Card key={item.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCode className="mr-2 h-5 w-5" />
                  <span className="truncate">
                    {item.language} / {item.framework}
                  </span>
                </CardTitle>
                <CardDescription>
                  {item.created_at && <span>Created {formatDistanceToNow(new Date(item.created_at))} ago</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <div className="text-sm font-medium mb-1">Requirements:</div>
                  <div className="text-sm text-muted-foreground">{truncatedRequirements || "N/A"}</div>
                </div>
                {item.specification_id && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">Specification:</div>
                    <div className="text-sm text-muted-foreground">{appName}</div>
                  </div>
                )}
                {item.design_id && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">Design:</div>
                    <div className="text-sm text-muted-foreground">{designType}</div>
                  </div>
                )}
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Link href={`/code-generation/${item.id}`}>
                  <Button className="w-full">
                    <Code className="mr-2 h-4 w-4" />
                    View Code
                  </Button>
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
