import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSpecificationsImproved } from "../../specification-generator/improved-actions"
import CodeGenerationForm from "./code-generation-form"

export default async function ImprovedCodeGenerationPage({
  searchParams,
}: {
  searchParams: { specId?: string; designId?: string }
}) {
  const { specId, designId } = searchParams

  // Fetch specifications for the dropdown
  const { data: specifications } = await getSpecificationsImproved()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Generate Code</h1>

      <Card>
        <CardHeader>
          <CardTitle>Code Generation</CardTitle>
          <CardDescription>Generate code based on your specifications and designs using AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeGenerationForm specifications={specifications || []} initialSpecId={specId} initialDesignId={designId} />
        </CardContent>
      </Card>
    </div>
  )
}
