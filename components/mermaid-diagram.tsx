"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { validateMermaidSyntax, validateMermaidSyntaxComponent } from "@/lib/mermaid-utils"

interface MermaidDiagramProps {
  code: string
  className?: string
}

export default function MermaidDiagram({ code, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [sanitizedCode, setSanitizedCode] = useState<string>(code)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        htmlLabels: true,
        curve: "basis",
      },
      logLevel: 1,
    })

    const renderDiagram = async () => {
      if (!containerRef.current) return

      try {
        containerRef.current.innerHTML = ""
        setError(null)

        // Choose sanitizer based on diagram type
        const trimmed = code.trim()
        const sanitized = trimmed.startsWith("classDiagram")
          ? validateMermaidSyntaxComponent(code)
          : validateMermaidSyntax(code)
        setSanitizedCode(sanitized)

        // Render with a unique ID
        const id = `mermaid-diagram-${Date.now()}`
        const { svg } = await mermaid.render(id, sanitized)

        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err: any) {
        console.error("Mermaid rendering error:", err)
        setError(err.message || "Unknown error")

        // Fallback for flowcharts only
        try {
          const fallback = `flowchart TD
           A[\"Frontend\"] --> B[\"API\"]
           B --> C[\"Database\"]`
          const { svg } = await mermaid.render(`fallback-${Date.now()}`, fallback)

          if (containerRef.current) {
            containerRef.current.innerHTML = `
             <div class=\"p-4 border border-yellow-300 bg-yellow-50 rounded text-yellow-700 mb-4\">
               <p class=\"font-medium\">Warning: Using fallback diagram</p>
               <p class=\"text-sm\">Original diagram could not be rendered due to syntax errors.</p>
             </div>
             ${svg}
           `
          }
        } catch (fallbackErr) {
          if (containerRef.current) {
            containerRef.current.innerHTML = `
             <div class=\"p-4 border border-red-300 bg-red-50 rounded text-red-700\">
               <p class=\"font-medium\">Diagram Error</p>
               <p class=\"text-sm\">${err.message || "Unknown error"}</p>
             </div>
           `
          }
        }
      }
    }

    renderDiagram()
  }, [code])

  return (
    <div className={`mermaid-container ${className}`}>
      {error ? (
        <div className="p-4 border border-red-300 bg-red-50 rounded text-red-700">
          <p className="font-medium">Diagram Error</p>
          <p className="text-sm">{error}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">Show diagram code</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{sanitizedCode}</pre>
          </details>
        </div>
      ) : (
        <div ref={containerRef} className="flex items-center justify-center h-full" />
      )}
    </div>
  )
}
