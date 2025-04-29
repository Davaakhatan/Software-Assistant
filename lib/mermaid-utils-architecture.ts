/**
 * Validates and fixes common issues in Mermaid flowchart syntax for system architecture
 */
export function validateMermaidSyntaxArchitecture(code: string): string {
  let cleanedCode = code.trim()

  // 1) Strip any stray graph/classDiagram directives
  cleanedCode = cleanedCode.replace(/^(graph\s+(?:TD|LR)|classDiagram).*$/m, "")

  // 2) Ensure a graph header on its own line
  if (!/^graph (?:TD|LR)/.test(cleanedCode)) {
    cleanedCode = "graph TD\n" + cleanedCode
  } else {
    cleanedCode = cleanedCode.replace(/^(graph (?:TD|LR))\s*(?!\n)/, "$1\n")
  }

  // 3) Fix common typos
  cleanedCode = cleanedCode
    .replace(/subgrap\b/gi, "subgraph") // missing 'h'
    .replace(/subgraphh+/gi, "subgraph") // extra 'h'

  // 4) Aggressively escape labels
  cleanedCode = cleanedCode.replace(/\[([^\]]*)\]/g, (_, label) => {
    let esc = label
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

    if (/\s|,|:/.test(esc)) esc = `"${esc}"`
    return `[${esc}]`
  })

  // 5) (Optional) split edges onto separate lines
  cleanedCode = cleanedCode.split("-->").join("-->\n")

  return cleanedCode.trim()
}

/**
 * Checks if the Mermaid syntax is valid for a system architecture diagram
 */
export function isValidMermaidSyntaxArchitecture(code: string): boolean {
  // Basic validation - check if it starts with graph
  if (!code.trim().startsWith("graph")) {
    return false
  }

  // Check for balanced subgraphs
  let subgraphCount = 0
  const lines = code.split("\n")

  for (const line of lines) {
    if (line.trim().startsWith("subgraph")) subgraphCount++
    if (line.trim() === "end") subgraphCount--
    if (subgraphCount < 0) return false // End without subgraph
  }

  return subgraphCount === 0 // All subgraphs should be closed
}
