"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface CodeGenerationButtonProps {
  specificationId: string
}

export default function CodeGenerationButton({ specificationId }: CodeGenerationButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/code-generation/improved?specId=${specificationId}`)
  }

  return (
    <Button onClick={handleClick} className="ml-2">
      Generate Code
    </Button>
  )
}
