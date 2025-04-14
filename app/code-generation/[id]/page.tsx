import type { Metadata } from "next"
import { getGeneratedCodeById } from "../actions"
import { notFound } from "next/navigation"
import CodeGenerationClientPage from "./ClientPage"

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

  return <CodeGenerationClientPage data={data} id={id} />
}
