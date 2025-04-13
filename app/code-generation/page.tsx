import { getSupabaseServer } from "@/lib/supabase-server"
import { CodeForm } from "./code-form"
import Link from "next/link"

export default async function CodeGenerationPage() {
  const supabase = getSupabaseServer()

  // Fetch specifications
  const { data: specifications } = await supabase.from("specifications").select("id, app_name")

  // Fetch designs
  const { data: designs } = await supabase.from("designs").select("id, type")

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Code Generation</h1>
      <CodeForm specifications={specifications || []} designs={designs || []} />

      {/* Tips and Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Code Generation Tips */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">Code Generation Tips</h2>
          <p className="text-sm text-gray-600 mb-4">Get the most out of automatic code generation</p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Be Specific</h3>
              <p className="text-sm">The more detailed your requirements, the better the generated code.</p>
            </div>

            <div>
              <h3 className="font-semibold">Review Generated Code</h3>
              <p className="text-sm">Always review and understand the generated code before using it.</p>
            </div>

            <div>
              <h3 className="font-semibold">Iterative Approach</h3>
              <p className="text-sm">Generate code in small chunks and refine as needed.</p>
            </div>

            <div>
              <h3 className="font-semibold">Customize</h3>
              <p className="text-sm">Use generated code as a starting point and customize to your needs.</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">Next Steps</h2>
          <p className="text-sm text-gray-600 mb-4">After generating code</p>

          <p className="mb-4">
            Once you've generated your code, you can move on to testing or setting up CI/CD pipelines.
          </p>

          <div className="space-y-2">
            <Link href="/testing" className="block w-full p-3 border rounded text-center hover:bg-gray-50">
              Test Automation
            </Link>

            <Link href="/cicd" className="block w-full p-3 border rounded text-center hover:bg-gray-50">
              CI/CD Pipeline
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
