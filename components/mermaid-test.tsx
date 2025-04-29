"use client"

import { useState, useEffect } from "react"
import MermaidDiagram from "./mermaid-diagram-component"

export default function MermaidTest() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const testDiagram = `classDiagram
    class User {
      +String id
      +String name
      +authenticate()
    }
    class System {
      +process()
    }
    User --> System: uses`

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">Mermaid Test</h3>
      <div className="h-[200px] border rounded-md p-2 bg-white">
        <MermaidDiagram code={testDiagram} />
      </div>
    </div>
  )
}
