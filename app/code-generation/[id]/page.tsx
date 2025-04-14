import { redirect } from "next/navigation"

export default function CodeGenerationPage({ params }: { params: { id: string } }) {
  const { id } = params
  redirect(`/code-view/${id}`)
}
