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
    const sanitizeMermaidCode = (code: string): string => {
      if (!code) return ""

      // Normalize line breaks
      let sanitized = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

      // Detect diagram type
      let diagramType = "graph"
      if (sanitized.trim().startsWith("classDiagram")) {
        diagramType = "classDiagram"
      } else if (sanitized.trim().startsWith("sequenceDiagram")) {
        diagramType = "sequenceDiagram"
      } else if (sanitized.trim().startsWith("erDiagram")) {
        diagramType = "erDiagram"
      } else if (sanitized.trim().startsWith("flowchart")) {
        diagramType = "flowchart"
      }

      // Fix common syntax issues

      // Ensure 'end' is always on its own line
      sanitized = sanitized.replace(/(\S+)end(\s|$)/g, "$1\nend$2")
      sanitized = sanitized.replace(/end(\S+)/g, "end\n$1")

      // Ensure proper spacing around arrows
      sanitized = sanitized.replace(/([A-Za-z0-9_")])(\s*)-->/g, "$1 -->")
      sanitized = sanitized.replace(/-->(\s*)([A-Za-z0-9_"(])/g, "--> $2")

      // Split into lines for processing
      const lines = sanitized.split("\n")
      const processedLines = []

      // Process each line based on diagram type
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim()

        // Skip empty lines
        if (!line) continue

        // Handle comments - ensure they're on their own line
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

        // Process based on diagram type
        if (diagramType === "classDiagram") {
          // For class diagrams
          if (line.startsWith("class ")) {
            processedLines.push(line)
          } else if (line.includes("-->") || line.includes("<--")) {
            // Fix relationship syntax
            line = line.replace(/([A-Za-z0-9_-]+)\s*-->\s*([A-Za-z0-9_-]+)/g, "$1 --> $2")
            line = line.replace(/([A-Za-z0-9_-]+)\s*<--\s*([A-Za-z0-9_-]+)/g, "$1 <-- $2")
            processedLines.push(line)
          } else {
            processedLines.push(line)
          }
        } else if (diagramType === "graph" || diagramType === "flowchart") {
          // For flowcharts and graphs
          if (line.startsWith("subgraph")) {
            // Fix subgraph titles with spaces
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
          } else if (line === "end") {
            // Ensure 'end' is properly isolated
            processedLines.push(line)
          } else if (line.includes("[") && line.includes("]")) {
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
          } else if (line.includes("-->")) {
            // Fix connection syntax with multiple arrows
            if (line.split("-->").length > 2) {
              // Split the line into segments
              const segments = line.split("-->").map((s) => s.trim())

              // Process each segment pair
              for (let j = 0; j < segments.length - 1; j++) {
                const fromNode = segments[j]
                const toNode = segments[j + 1]

                // Create a separate connection for each pair
                processedLines.push(`${fromNode} --> ${toNode}`)
              }
            } else {
              // Handle single arrow connections
              const parts = line.split("-->")
              if (parts.length === 2) {
                const leftNode = parts[0].trim()
                let rightNode = parts[1].trim()

                // If right side has brackets but no node ID, create a proper node
                if (rightNode.startsWith("[") && !rightNode.match(/^[A-Za-z0-9_]+\[/)) {
                  // Generate a unique node ID
                  const nodeId = `Node${Math.floor(Math.random() * 10000)}`
                  rightNode = `${nodeId}${rightNode}`
                }
                // If right side is not a node ID and doesn't have brackets, add them
                else if (!rightNode.startsWith("[") && !rightNode.startsWith("(") && rightNode.includes(" ")) {
                  // Generate a unique node ID
                  const nodeId = `Node${Math.floor(Math.random() * 10000)}`
                  rightNode = `${nodeId}["${rightNode}"]`
                }

                processedLines.push(`${leftNode} --> ${rightNode}`)
              } else {
                // Just add the line as is if we can't parse it
                processedLines.push(line)
              }
            }
          } else {
            processedLines.push(line)
          }
        } else {
          // Default case for other diagram types
          processedLines.push(line)
        }
      }

      // Rebuild the diagram with proper formatting
      let result = ""

      // Add diagram type declaration if missing
      if (diagramType === "classDiagram" && !lines[0].startsWith("classDiagram")) {
        result = "classDiagram\n"
      } else if (diagramType === "sequenceDiagram" && !lines[0].startsWith("sequenceDiagram")) {
        result = "sequenceDiagram\n"
      } else if (diagramType === "erDiagram" && !lines[0].startsWith("erDiagram")) {
        result = "erDiagram\n"
      } else if (diagramType === "flowchart" && !lines[0].startsWith("flowchart")) {
        result = "flowchart TD\n"
      } else if (diagramType === "graph" && !lines[0].startsWith("graph")) {
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

            // Fallback to a simpler diagram if there's an error
            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div class="p-4 border border-red-300 bg-red-50 rounded text-red-700">
                  <p class="font-medium">Error rendering diagram</p>
                  <p class="text-sm">${err.message || "Unknown error"}</p>
                </div>
              `
            }
          })
      }
    } catch (err) {
      console.error("Mermaid error:", err)
      setError(`Error initializing diagram: ${err.message || "Unknown error"}`)
    }
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
