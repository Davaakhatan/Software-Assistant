import type { Metadata } from "next"
import { getGeneratedCodeById } from "@/app/code-generation/actions"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CodeBlock } from "@/components/code-block"
import { CopyButton } from "@/components/copy-button"

export const metadata: Metadata = {
  title: "View Generated Code | SDLC Companion",
  description: "View your generated code",
}

export default async function CodeGenerationPage({ params }: { params: { id: string } }) {
  const { id } = params

  const { success, data, error } = await getGeneratedCodeById(id)

  if (!success || !data) {
    if (error?.includes("Row not found")) {
      notFound()
    }

    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">View Generated Code</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error fetching generated code: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Link href="/code-generation/saved">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Saved Code
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {data.language} / {data.framework}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{data.requirements || "No requirements specified"}</p>
          </CardContent>
        </Card>

        {data.specifications && (
          <Card>
            <CardHeader>
              <CardTitle>Specification: {data.specifications.app_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>App Name: {data.specifications.app_name}</p>
            </CardContent>
          </Card>
        )}

        {data.designs && (
          <Card>
            <CardHeader>
              <CardTitle>Design: {data.designs.type}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Design Type: {data.designs.type}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Code</CardTitle>
            <CopyButton text={data.generated_code} />
          </CardHeader>
          <CardContent>
            <div className="relative">
              <CodeBlock code={data.generated_code} language={data.language.toLowerCase()} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
