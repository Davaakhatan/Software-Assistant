import { getPipelines } from "../actions"
import SavedPipelinesClient from "./saved-pipelines-client"

export default async function SavedPipelinesPage() {
  const { data: pipelines, error, needsSetup } = await getPipelines()

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Saved Pipelines</h1>
      <p className="text-muted-foreground mb-8">View and manage your saved CI/CD pipelines</p>

      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
          Error loading pipelines: {error}
        </div>
      ) : (
        <SavedPipelinesClient pipelines={pipelines || []} needsSetup={needsSetup} />
      )}
    </div>
  )
}
