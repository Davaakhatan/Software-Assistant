"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Use dynamic import with SSR disabled to avoid hydration issues
const CodeGenerationForm = dynamic(() => import("./code-generation-form"), {
  ssr: false,
})

const SetupDatabase = dynamic(() => import("./setup-database"), {
  ssr: false,
})

export function CodeGenerationClient() {
  return (
    <>
      <Suspense fallback={<div>Loading database setup...</div>}>
        <SetupDatabase />
      </Suspense>

      <Suspense fallback={<div>Loading code generation form...</div>}>
        <CodeGenerationForm />
      </Suspense>
    </>
  )
}
