"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

interface MermaidDiagramProps {
  code: string
  className?: string
}

export default function MermaidDiagram({ code, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    // Only run on client and after mount
    if (typeof window === "undefined" || !isMounted || !containerRef.current) return

    const renderDiagram = async () => {
      try {
        setError(null)

        // Clear previous diagram
        if (containerRef.current) {
          containerRef.current.innerHTML = ""
        }

        // Initialize mermaid with configuration
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
            fontFamily: "sans-serif", // Use a local font
            flowchart: {
              htmlLabels: true,
              curve: "basis",
            },
            er: {
              layoutDirection: "TB",
            },
            classDiagram: {
              diagramPadding: 8,
            },
          })
        } catch (initErr) {
          console.error("Failed to initialize mermaid:", initErr)
          setError(`Mermaid initialization error: ${initErr.message || "Unknown error"}`)
          return
        }

        // Create a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`

        // Ensure the code is valid
        let processedCode = code.trim()

        // Ensure it starts with classDiagram
        if (!processedCode.startsWith("classDiagram")) {
          processedCode = "classDiagram\n" + processedCode
        }

        try {
          // Render the diagram
          const { svg } = await mermaid.render(id, processedCode)

          // Make sure container still exists (could have unmounted during async operation)
          if (containerRef.current) {
            // Set the innerHTML directly
            containerRef.current.innerHTML = svg
          }
        } catch (err) {
          console.error("Error rendering Mermaid diagram:", err)
          setError(`Error rendering diagram: ${err.message || "Unknown error"}`)

          // Display a simplified version of the error
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="p-4 text-red-500 border border-red-200 rounded-md">
                <p class="font-medium">Error rendering diagram</p>
                <p class="text-sm mt-1">${err.message || "Check your Mermaid syntax"}</p>
                <p class="text-sm mt-1">Try refreshing the page or check your diagram syntax.</p>
              </div>
            `
          }

          // Try with a fallback diagram
          try {
            const fallbackDiagram = `classDiagram
              class User {
                +String id
                +String name
                +authenticate()
              }
              class System {
                +process()
              }
              User --> System: uses`

            const fallbackId = `fallback-${Math.random().toString(36).substring(2, 11)}`
            const { svg } = await mermaid.render(fallbackId, fallbackDiagram)

            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div class="p-4 text-amber-500 border border-amber-200 rounded-md mb-4">
                  <p class="font-medium">Using fallback diagram</p>
                  <p class="text-sm mt-1">The original diagram had syntax errors.</p>
                </div>
                ${svg}
              `
            }
          } catch (fallbackErr) {
            console.error("Even fallback diagram failed:", fallbackErr)
          }
        }
      } catch (err) {
        console.error("Error in diagram rendering process:", err)
        setError(err.message || "Failed to render diagram")
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderDiagram()
    }, 100)

    return () => clearTimeout(timer)
  }, [code, isMounted])

  // If not mounted yet, show a loading placeholder
  if (!isMounted) {
    return (
      <div className={`mermaid-diagram-container ${className} flex items-center justify-center p-4 bg-gray-50`}>
        <div className="text-gray-400">Loading diagram...</div>
      </div>
    )
  }

  return (
    <div className={`mermaid-diagram-container ${className}`}>
      <div ref={containerRef} className="mermaid-content w-full h-full" />
      {error && (
        <div className="mt-2 text-xs text-red-500">
          <p>Error: {error}</p>
          <p>Try refreshing the page or check your diagram syntax.</p>
        </div>
      )}
    </div>
  )
}
