import { DesignsDebugClient } from "./client"

export default function DesignsDebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Designs Debug Page</h1>
      <p className="text-muted-foreground mb-6">
        This page helps diagnose issues with designs fetching and relationships between specifications, requirements,
        and designs.
      </p>

      <DesignsDebugClient />
    </div>
  )
}
