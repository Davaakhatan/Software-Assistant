/**
 * Utility functions for working with Mermaid diagrams
 */

/**
 * Validates and fixes common Mermaid syntax issues
 * @param code The Mermaid diagram code to validate
 * @returns The fixed Mermaid diagram code
 */
export function validateMermaidSyntax(code: string): string {
  if (!code) return ""

  // Normalize line breaks
  let sanitized = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Fix common syntax issues

  // Ensure 'end' is always on its own line
  sanitized = sanitized.replace(/(\S+)end(\s|$)/g, "$1\nend$2")
  sanitized = sanitized.replace(/end(\S+)/g, "end\n$1")

  // Ensure proper spacing around arrows
  sanitized = sanitized.replace(/([A-Za-z0-9_")])(\s*)-->/g, "$1 -->")
  sanitized = sanitized.replace(/-->(\s*)([A-Za-z0-9_"(])/g, "--> $2")

  // Fix arrow connections with text instead of nodes
  sanitized = sanitized.replace(/-->(\s*)([A-Za-z0-9_\s]+)(?!\[|\(|\{|"|')/g, (match, space, text) => {
    // If the text doesn't look like a node ID, wrap it in brackets and quotes
    if (text.includes(" ") || /[^A-Za-z0-9_]/.test(text)) {
      return `--> ["${text.trim()}"]`
    }
    return `--> ${text.trim()}`
  })

  // Split into lines for processing
  const lines = sanitized.split("\n")
  const processedLines = []

  // Process each line
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
    }
    // Handle end statements
    else if (line === "end") {
      processedLines.push(line)
    }
    // Handle node definitions
    else if (line.includes("[") && line.includes("]")) {
      // Fix node text with spaces
      line = line.replace(/\[([^\]]*)\]/g, (match, p1) => {
        if (/[\s$[\]/\\:;,]/.test(p1) && !p1.startsWith('"') && !p1.endsWith('"')) {
          return `["${p1}"]`
        }
        return match
      })

      // Fix parentheses in node text
      line = line.replace(/\[([^\]]*$$[^$$]*\)[^\]]*)\]/g, (match) => {
        return match.replace(/$$/g, "&#40;").replace(/$$/g, "&#41;")
      })

      processedLines.push(line)
    }
    // Handle connections
    else if (line.includes("-->")) {
      // Fix connection syntax
      const parts = line.split("-->")
      if (parts.length === 2) {
        const leftNode = parts[0].trim()
        let rightNode = parts[1].trim()

        // If right side is not a node ID and doesn't have brackets, add them
        if (!rightNode.startsWith("[") && !rightNode.startsWith("(") && rightNode.includes(" ")) {
          rightNode = `["${rightNode}"]`
        }

        processedLines.push(`${leftNode} --> ${rightNode}`)
      } else {
        // Complex case with multiple arrows, just add the line as is
        processedLines.push(line)
      }
    } else {
      processedLines.push(line)
    }
  }

  return processedLines.join("\n")
}

/**
 * Extracts node IDs from a Mermaid diagram
 * @param code The Mermaid diagram code
 * @returns An array of node IDs
 */
export function extractNodeIds(code: string): string[] {
  const nodeIds = new Set<string>()

  // Split into lines
  const lines = code.split("\n")

  // Extract node IDs
  for (const line of lines) {
    // Match node definitions like "NodeA[Label]" or "NodeA("Label")"
    const nodeDefMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*(\[|\(|\{)/)
    if (nodeDefMatch) {
      nodeIds.add(nodeDefMatch[1])
    }
  }

  return Array.from(nodeIds)
}
