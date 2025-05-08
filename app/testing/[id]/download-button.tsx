"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DownloadButton({ test }) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    try {
      setIsDownloading(true)

      // Parse the generated_tests JSON if it's a string
      let testData
      if (typeof test.generated_tests === "string") {
        try {
          testData = JSON.parse(test.generated_tests)
        } catch (e) {
          testData = { generatedCode: test.generated_tests }
        }
      } else {
        testData = test.generated_tests
      }

      const codeToDownload = testData.generatedCode || testData

      // Create a blob and download it
      const blob = new Blob([codeToDownload], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${test.name || "test"}.${test.framework === "jest" ? "test.js" : test.framework === "vitest" ? "spec.js" : "js"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Test downloaded",
        description: "Your test has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading test:", error)
      toast({
        title: "Error",
        description: "Failed to download test",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download Test"}
    </Button>
  )
}
