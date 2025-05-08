import { getPipelineById } from "../actions"
import PipelineDetailClient from "./pipeline-detail-client"
import { notFound } from "next/navigation"

export default async function PipelineDetailPage({ params }: { params: { id: string } }) {
  const { data: pipeline, error, success } = await getPipelineById(params.id)

  if (error || !success || !pipeline) {
    console.error("Error loading pipeline:", error)
    notFound()
  }

  return <PipelineDetailClient pipeline={pipeline} />
}
