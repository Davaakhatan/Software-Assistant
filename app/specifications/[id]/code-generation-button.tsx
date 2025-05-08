"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Code } from "lucide-react"

interface CodeGenerationButtonProps {
  specId: string
}

export default function CodeGenerationButton({ specId }: CodeGenerationButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/code-generation/improved?specId=${specId}`)
  }

  return (
    <Button onClick={handleClick} className="gap-2">
      <Code className="h-4 w-4" />
      Generate Code
    </Button>
  )
}
