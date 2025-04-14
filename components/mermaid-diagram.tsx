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
  const [sanitizedCode, setSanitizedCode] = useState<string>(code)

  useEffect(() => {
    // Initialize mermaid with more permissive settings
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        htmlLabels: true,
        curve: "basis",
      },
      logLevel: 1, // Set to 1 for error only, 5 for debug
    })

    // Function to sanitize Mermaid code
    const sanitizeMermaidCode = (inputCode: string): string => {
      if (!inputCode) {
        return ""
      }

      // Step 1: Normalize line breaks and remove carriage returns
      const sanitized = inputCode.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

      // Step 2: Detect diagram type
      let diagramType = "flowchart"
      if (sanitized.trim().startsWith("classDiagram")) {
        diagramType = "classDiagram"
      } else if (sanitized.trim().startsWith("sequenceDiagram")) {
        diagramType = "sequenceDiagram"
      } else if (sanitized.trim().startsWith("erDiagram")) {
        diagramType = "erDiagram"
      } else if (sanitized.trim().startsWith("graph")) {
        diagramType = "graph"
      }

      // Step 3: Split into lines for more detailed processing
      const lines = sanitized.split("\n")
      const processedLines = []
      let inSubgraph = false

      // Step 4: Process each line based on content
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim()

        // Skip empty lines
        if (!line) continue

        // Handle comments
        if (line.includes("%%")) {
          const parts = line.split("%%")
          if (parts[0].trim()) {
            processedLines.push(parts[0].trim())
          }
          if (parts[1].trim()) {
            processedLines.push(`%% ${parts[1].trim()}`)
          }
          continue
        }

        // Handle subgraph declarations
        if (line.startsWith("subgraph")) {
          const titleMatch = line.match(/subgraph\s+(.+)/)
          if (titleMatch) {
            const title = titleMatch[1]
            if (title.includes(" ") && !title.startsWith('"') && !title.endsWith('"')) {
              processedLines.push(`subgraph "${title}"`)
            } else {
              processedLines.push(line)
            }
          } else {
            processedLines.push(line)
          }
          inSubgraph = true
        }
        // Handle end statements - ensure they're isolated
        else if (line === "end") {
          processedLines.push("end")
          inSubgraph = false
        }
        // Handle node definitions with brackets
        else if (line.includes("[") && line.includes("]")) {
          // Fix node text with spaces
          line = line.replace(/\[([^\]]*)\]/g, (match, p1) => {
            // Replace forward slashes with a safe character
            const sanitizedP1 = p1.replace(/\//g, "&#47;")
            if (/[\s$[\]/\\:;,]/.test(sanitizedP1) && !sanitizedP1.startsWith('"') && !sanitizedP1.endsWith('"')) {
              return `["${sanitizedP1}"]`
            }
            return match
          })

          // Fix parentheses in node text
          line = line.replace(/\[([^\]]*$[^)]*$[^\]]*)\]/g, (match) => {
            return match.replace(/$/g, "&#40;").replace(/$/g, "&#41;")
          })

          processedLines.push(line)
        }
        // Handle connections with arrows
        else if (line.includes("-->")) {
          // Ensure proper spacing around arrows
          line = line.replace(/([A-Za-z0-9_")])(\s*)-->/g, "$1 -->")
          line = line.replace(/-->(\s*)([A-Za-z0-9_"(])/g, "--> $2")

          // Split multiple connections into separate lines
          const segments = line.split("-->").map((s) => s.trim())
          if (segments.length > 2) {
            for (let j = 0; j < segments.length - 1; j++) {
              processedLines.push(`${segments[j]} --> ${segments[j + 1]}`)
            }
          } else {
            processedLines.push(line)
          }
        }
        // Handle direction declarations within subgraphs
        else if (line.match(/^(direction\s+(TB|BT|LR|RL))$/i) && inSubgraph) {
          // Ensure the direction is properly separated
          const directionMatch = line.match(/^(direction\s+(TB|BT|LR|RL))$/i)
          if (directionMatch) {
            processedLines.push(line)
          }
        }
        // Default case for other lines
        else {
          processedLines.push(line)
        }
      }

      // Step 7: Rebuild the diagram with proper formatting
      let result = ""

      // Add diagram type declaration if missing
      if (diagramType === "classDiagram" && !processedLines[0]?.startsWith("classDiagram")) {
        result = "classDiagram\n"
      } else if (diagramType === "sequenceDiagram" && !processedLines[0]?.startsWith("sequenceDiagram")) {
        result = "sequenceDiagram\n"
      } else if (diagramType === "erDiagram" && !processedLines[0]?.startsWith("erDiagram")) {
        result = "erDiagram\n"
      } else if (diagramType === "flowchart" && !processedLines[0]?.startsWith("flowchart")) {
        result = "flowchart TD\n"
      } else if (diagramType === "graph" && !processedLines[0]?.startsWith("graph")) {
        result = "graph LR\n"
      }

      // Add processed lines
      result += processedLines.join("\n")

      return result
    }

    // Sanitize the code
    const sanitized = sanitizeMermaidCode(code)
    setSanitizedCode(sanitized)

    try {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
        setError(null)

        // Generate a unique ID for this render
        const id = `mermaid-diagram-${Date.now()}`

        // Render the diagram
        mermaid
          .render(id, sanitized)
          .then(({ svg }) => {
            if (containerRef.current) {
              containerRef.current.innerHTML = svg
            }
          })
          .catch((err) => {
            console.error("Mermaid rendering error:", err)
            setError(`Error rendering diagram: ${err.message || "Unknown error"}`)

            // Try one more time with a simplified version
            try {
              const simplifiedCode = simplifyDiagram(sanitized)
              mermaid
                .render(`${id}-simplified`, simplifiedCode)
                .then(({ svg }) => {
                  if (containerRef.current) {
                    containerRef.current.innerHTML = svg
                  }
                  setError(null)
                })
                .catch((simplifyErr) => {
                  // If still fails, show error
                  if (containerRef.current) {
                    containerRef.current.innerHTML = `
                      <div class="p-4 border border-red-300 bg-red-50 rounded text-red-700">
                        <p class="font-medium">Error rendering diagram</p>
                        <p class="text-sm">${err.message || "Unknown error"}</p>
                      </div>
                    `
                  }
                })
            } catch (simplifyErr) {
              // If simplification fails, show original error
              if (containerRef.current) {
                containerRef.current.innerHTML = `
                  <div class="p-4 border border-red-300 bg-red-50 rounded text-red-700">
                    <p class="font-medium">Error rendering diagram</p>
                    <p class="text-sm">${err.message || "Unknown error"}</p>
                  </div>
                `
              }
            }
          })
      }
    } catch (err) {
      console.error("Mermaid error:", err)
      setError(`Error initializing diagram: ${err.message || "Unknown error"}`)
    }
  }, [code])

  // Function to simplify a diagram when rendering fails
  const simplifyDiagram = (code: string): string => {
    // Extract the diagram type (flowchart TD, graph LR, etc.)
    const typeMatch = code.match(/^(flowchart\s+[A-Z]{2}|graph\s+[A-Z]{2}|classDiagram|sequenceDiagram|erDiagram)/i)
    const diagramType = typeMatch ? typeMatch[0] : "flowchart TD"

    // Create a minimal valid diagram
    return `${diagramType}\n  A[Start] --> B[End]`
  }

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
