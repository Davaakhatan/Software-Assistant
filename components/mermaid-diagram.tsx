"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import mermaid from "mermaid"

interface MermaidDiagramProps {
  code: string
  className?: string
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, className }) => {
  const diagramRef = useRef(null)

  useEffect(() => {
    if (!code || !diagramRef.current) return

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "neutral",
    })

    const renderDiagram = async () => {
      if (diagramRef.current) {
        try {
          diagramRef.current.innerHTML = "" // Clear previous diagram
          const { svg } = await mermaid.render(`mermaid-diagram-${Date.now()}`, code)

          // Check if the component is still mounted before updating
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svg
          }
        } catch (e) {
          console.error("Error rendering mermaid diagram", e)
          if (diagramRef.current) {
            diagramRef.current.innerHTML = `<p class="text-red-500">Error rendering diagram. Check console for details.</p>`
          }
        }
      }
    }

    // Small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      renderDiagram()
    }, 100)

    return () => clearTimeout(timer)
  }, [code])

  return (
    <div className={className} data-testid="mermaid-diagram">
      <div ref={diagramRef} className="mermaid" />
    </div>
  )
}

export default MermaidDiagram
