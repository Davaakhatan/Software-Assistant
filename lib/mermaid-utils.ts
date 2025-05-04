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

  // Remove comments that are causing issues
  sanitized = sanitized.replace(/\s*%%.*$/gm, "")

  // Replace special characters in type definitions
  sanitized = sanitized.replace(/~/g, ".")

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

  // Handle subgraph syntax issues
  sanitized = sanitized.replace(/subgraph\s+([^"\n]+)(?!\s*")/g, (match, title) => {
    if (title.includes(" ")) {
      return `subgraph "${title.trim()}"`
    }
    return match
  })

  // Handle node definitions and connections
  sanitized = sanitized.replace(/\[([^\]]*)\]/g, (match, p1) => {
    if (/[\s$[\]/\\:;,]/.test(p1) && !p1.startsWith('"') && !p1.endsWith('"')) {
      return `["${p1}"]`
    }
    return match
  })

  // Fix parentheses in node text - replace with HTML entities
  sanitized = sanitized.replace(/\[([^\]]*$[^)]*$[^\]]*)\]/g, (match) => {
    return match.replace(/$/g, "&#40;").replace(/$/g, "&#41;")
  })

  // Ensure that node labels with special characters are properly escaped
  sanitized = sanitized.replace(/([A-Za-z0-9_]+)\[([^\]]+)\]/g, (match, nodeId, label) => {
    if (label.includes("]") || label.includes("[")) {
      return `${nodeId}["${label.replace(/["']/g, "'")}"]`
    }
    return match
  })

  // Aggressively escape special characters within node labels
  sanitized = sanitized.replace(/\[([^\]]*)\]/g, (match, label) => {
    const escapedLabel = label
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
    return `[${escapedLabel}]`
  })

  // Split into lines for processing
  const lines = sanitized.split("\n")
  const processedLines = []

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

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

      // Fix parentheses in node text - replace with HTML entities
      line = line.replace(/\[([^\]]*$[^)]*$[^\]]*)\]/g, (match) => {
        return match.replace(/$/g, "&#40;").replace(/$/g, "&#41;")
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
    }
    // Handle class properties
    else if (line.includes(" : ")) {
      // Ensure there are no trailing comments or special characters
      const cleanedLine = line.split("%%")[0].trim()
      processedLines.push(cleanedLine)
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

/**
 * Validates the syntax of a Mermaid architecture diagram
 * @param code The Mermaid diagram code to validate
 * @returns The validated code or an empty string if invalid
 */
export function validateMermaidSyntaxArchitecture(code: string): string {
  // Basic check to prevent empty code
  if (!code || code.trim() === "") {
    return "" // Return empty string if code is empty
  }

  // Check if the code starts with 'graph'
  if (!code.trim().startsWith("graph")) {
    // Try to fix it by adding 'graph TD' at the beginning
    code = "graph TD\n" + code
  }

  // Add more sophisticated validation here if needed
  return code // Return the original or fixed code
}

/**
 * Validates the syntax of a Mermaid component diagram
 * @param code The Mermaid diagram code to validate
 * @returns The validated code or an empty string if invalid
 */
export function validateMermaidSyntaxComponent(raw: string): string {
  // 1) Normalize line breaks and trim
  let code = raw.replace(/\r\n/g, "\n").trim();

  // 2) Ensure header
  if (!code.startsWith("classDiagram")) {
    code = `classDiagram\n\n${code}`;
  }

  // 3) Inject a blank line after the header if missing
  code = code.replace(/^classDiagram\n(?!\n)/, "classDiagram\n\n");

  // 4) Wrap any flat class + its properties into a brace block
  //    e.g. 
  //      class Users
  //      Users : id: int
  //      Users : name: string
  //    becomes
  //      class Users {
  //        id: int
  //        name: string
  //      }
  code = code.replace(
    /class\s+(\w+)\s*\n((?:\1\s*:\s*[^\n]+\n?)+)/g,
    (_match, className, propsBlock) => {
      // Extract just the property lines, remove the leading "ClassName : "
      const bodyLines = propsBlock
        .trim()
        .split("\n")
        .map((line) =>
          line.replace(new RegExp(`^${className}\\s*:\\s*`), "  ")
        )
        .join("\n");

      return `class ${className} {\n${bodyLines}\n}\n`;
    }
  );

  return code;
}

/**
 * Extracts a Mermaid diagram from a text specification
 * @param specification The text specification that might contain a Mermaid diagram
 * @returns The extracted Mermaid diagram code or null if none found
 */
export function extractMermaidDiagram(specification: string): string | null {
  if (!specification) return null

  // Look for Mermaid code blocks in markdown format
  const mermaidRegex = /```mermaid\s+([\s\S]*?)\s+```/
  const match = specification.match(mermaidRegex)

  if (match && match[1]) {
    return match[1].trim()
  }

  // If no markdown code block, look for graph TD or classDiagram
  if (specification.includes("graph TD") || specification.includes("graph LR")) {
    // Extract from "graph TD" to the end of that section
    const graphMatch = specification.match(/(graph\s+TD|graph\s+LR)[\s\S]*?(?=\n\s*\n|$)/)
    if (graphMatch) {
      return graphMatch[0].trim()
    }
  }

  if (specification.includes("classDiagram")) {
    // Extract from "classDiagram" to the end of that section
    const classMatch = specification.match(/classDiagram[\s\S]*?(?=\n\s*\n|$)/)
    if (classMatch) {
      return classMatch[0].trim()
    }
  }

  return null
}

/**
 * Checks if a string contains valid Mermaid diagram syntax
 * @param text The text to check
 * @returns True if the text contains Mermaid syntax, false otherwise
 */
export function containsMermaidSyntax(text: string): boolean {
  if (!text) return false

  // Check for common Mermaid syntax patterns
  const mermaidPatterns = [
    /graph\s+TD/i,
    /graph\s+LR/i,
    /classDiagram/i,
    /sequenceDiagram/i,
    /flowchart/i,
    /gantt/i,
    /pie/i,
    /erDiagram/i,
  ]

  return mermaidPatterns.some((pattern) => pattern.test(text))
}
