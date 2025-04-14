import { getGeneratedCode, deleteGeneratedCode } from "@/app/code-generation/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ClientPage from "./client-page"

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

      <ClientPage data={data} deleteGeneratedCode={deleteGeneratedCode} />
    </div>
  )
}
