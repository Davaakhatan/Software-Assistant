"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { validateMermaidSyntaxArchitecture } from "@/lib/mermaid-utils-architecture"

interface MermaidDiagramProps {
  code: string
  className?: string
}

export default function MermaidDiagram({ code, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [sanitizedCode, setSanitizedCode] = useState<string>(code)

  useEffect(() => {
    // Initialize mermaid with more permissive settings
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "sans-serif",
      flowchart: {
        htmlLabels: true,
        curve: "basis",
      },
      logLevel: 1, // Set to 1 for error only, 5 for debug
    })

    const renderDiagram = async () => {
      if (!containerRef.current) return

      try {
        containerRef.current.innerHTML = ""
        setError(null)

        // Sanitize the code using our utility function
        const sanitized = validateMermaidSyntaxArchitecture(code)
        setSanitizedCode(sanitized)

        // Generate a unique ID for this render
        const id = `mermaid-diagram-${Date.now()}`

        // Render the diagram
        const { svg } = await mermaid.render(id, sanitized)

        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err)
        setError(`Error rendering diagram: ${err.message || "Unknown error"}`)

        // Try with a minimal diagram as fallback
        try {
          const fallbackDiagram = `flowchart TD
          A["Frontend"] --> B["API"]
          B --> C["Database"]`

          const { svg } = await mermaid.render(`fallback-${Date.now()}`, fallbackDiagram)

          if (containerRef.current) {
            containerRef.current.innerHTML = `
            <div class="p-4 border border-yellow-300 bg-yellow-50 rounded text-yellow-700 mb-4">
              <p class="font-medium">Warning: Using fallback diagram</p>
              <p class="text-sm">The original diagram could not be rendered due to syntax errors.</p>
            </div>
            ${svg}
          `
          }
        } catch (fallbackErr) {
          if (containerRef.current) {
            containerRef.current.innerHTML = `
            <div class="p-4 border border-red-300 bg-red-50 rounded text-red-700">
              <p class="font-medium">Diagram Error</p>
              <p class="text-sm">${err.message || "Unknown error"}</p>
            </div>
          `
          }
        }
      }
    }

    renderDiagram()
  }, [code])

  return (
    <div className={`relative ${className}`}>
      {error && (
        <div className="p-4 border border-red-300 bg-red-50 rounded text-red-700">
          <p className="font-medium">Diagram Error</p>
          <p className="text-sm">{error}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">Show diagram code</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{sanitizedCode}</pre>
          </details>
        </div>
      )}
      <div ref={containerRef} className="mermaid-container w-full h-full" />
    </div>
  )
}
