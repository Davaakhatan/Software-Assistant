/**
 * Validates and fixes common issues in Mermaid class diagram syntax
 */
export function validateMermaidSyntaxComponent(code: string): string {
  // Ensure the code starts with classDiagram
  let cleanedCode = code.trim()

  // Remove any existing classDiagram declaration to avoid duplicates
  if (cleanedCode.startsWith("classDiagram")) {
    // Keep the classDiagram line and continue
  } else {
    cleanedCode = "classDiagram\n" + cleanedCode
  }

  // Fix common syntax issues
  const lines = cleanedCode.split("\n")
  const fixedLines = []

  for (let line of lines) {
    line = line.trim()

    // Skip empty lines
    if (!line) {
      fixedLines.push("")
      continue
    }

    // Handle the classDiagram line
    if (line === "classDiagram" || line.startsWith("classDiagram ")) {
      fixedLines.push(line)
      continue
    }

    // Fix relationship arrows if needed
    if (line.includes("-->") && !line.includes(":")) {
      // Add a default relationship name if missing
      line = line + ": relates to"
    }

    // Fix class definitions without proper brackets
    if (
      line.startsWith("class ") &&
      !line.includes("{") &&
      !line.includes("}") &&
      !line.includes("-->") &&
      !line.includes("<--")
    ) {
      // This is a class definition without brackets, add empty brackets
      line = line + " {}"
    }

    fixedLines.push(line)
  }

  return fixedLines.join("\n")
}

/**
 * Checks if the Mermaid syntax is valid for a class diagram
 */
export function isValidMermaidSyntaxComponent(code: string): boolean {
  // Basic validation - check if it starts with classDiagram
  if (!code.trim().startsWith("classDiagram")) {
    return false
  }

  // Check for balanced brackets
  let openBraces = 0
  for (const char of code) {
    if (char === "{") openBraces++
    if (char === "}") openBraces--
    if (openBraces < 0) return false // Closing brace without opening
  }

  return openBraces === 0 // All braces should be balanced
}

/**
 * Extracts node IDs from a Mermaid diagram
 * @param code The Mermaid diagram code
 * @returns An array of node IDs
 */
export function extractNodeIdsComponent(code: string): string[] {
  const nodeIds = new Set<string>()

  // Split into lines
  const lines = code.split("\n")

  // Extract node IDs
  for (const line of lines) {
    // Match class definitions
    const classMatch = line.match(/^\s*class\s+([A-Za-z0-9_]+)/)
    if (classMatch) {
      nodeIds.add(classMatch[1])
    }
  }

  return Array.from(nodeIds)
}
