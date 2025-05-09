"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DownloadButtonProps {
  testCode: string
  testName: string
  framework: string
}

export default function DownloadButton({ testCode, testName, framework }: DownloadButtonProps) {
  const handleDownload = () => {
    // Create a blob with the test code
    const blob = new Blob([testCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link element and trigger the download
    const a = document.createElement("a")
    a.href = url
    a.download = `${testName || "test"}.${framework === "jest" ? "test.js" : framework === "vitest" ? "spec.js" : "js"}`
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
      <Download className="h-4 w-4" />
      Download
    </Button>
  )
}
