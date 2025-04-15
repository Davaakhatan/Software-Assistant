import type { Metadata } from "next"
import CodeGenerationForm from "./code-generation-form"

export const metadata: Metadata = {
  title: "Code Generation | SDLC Companion",
  description: "Generate code from specifications, designs, or custom requirements",
}

export default function CodeGenerationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-10">Code Generation</h1>
      <CodeGenerationForm />
    </div>
  )
}
