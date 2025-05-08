"use client"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Database, RefreshCw } from "lucide-react"

export default function SchemaSwitcher() {
  const pathname = usePathname()
  const router = useRouter()

  const isImproved = pathname.includes("/improved")

  const handleSwitch = () => {
    if (isImproved) {
      // Switch to original schema
      if (pathname.includes("/specifications-list")) {
        router.push("/specifications-list")
      } else if (pathname.includes("/specification-generator")) {
        router.push("/specification-generator")
      } else if (pathname.includes("/code-generation")) {
        router.push("/code-generation")
      } else if (pathname.includes("/specifications/")) {
        const id = pathname.split("/").pop()
        router.push(`/specifications/${id}`)
      }
    } else {
      // Switch to improved schema
      if (pathname === "/specifications-list") {
        router.push("/specifications-list/improved")
      } else if (pathname === "/specification-generator") {
        router.push("/specification-generator/improved")
      } else if (pathname === "/code-generation") {
        router.push("/code-generation/improved")
      } else if (pathname.startsWith("/specifications/")) {
        const id = pathname.split("/").pop()
        router.push(`/specifications/${id}/improved`)
      }
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSwitch} className="gap-2">
      <Database className="h-4 w-4" />
      {isImproved ? "Switch to Original Schema" : "Switch to Improved Schema"}
      <RefreshCw className="h-3 w-3" />
    </Button>
  )
}
