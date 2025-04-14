"use client"

import { useEffect } from "react"
import Prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-css"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-csharp"
import "prismjs/components/prism-go"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-bash"

interface CodeBlockProps {
  code: string
  language: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  // Map common language names to Prism's language identifiers
  const languageMap: Record<string, string> = {
    javascript: "javascript",
    js: "javascript",
    typescript: "typescript",
    ts: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    python: "python",
    py: "python",
    java: "java",
    csharp: "csharp",
    "c#": "csharp",
    go: "go",
    rust: "rust",
    sql: "sql",
    bash: "bash",
    shell: "bash",
    css: "css",
  }

  const prismLanguage = languageMap[language.toLowerCase()] || "javascript"

  return (
    <div className="relative overflow-hidden rounded-md">
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={`language-${prismLanguage}`}>{code}</code>
      </pre>
    </div>
  )
}
