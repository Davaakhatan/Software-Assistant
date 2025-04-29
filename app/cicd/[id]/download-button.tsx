"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function DownloadButton({ pipeline }) {
  const handleDownload = () => {
    const filename = `${pipeline.project_name || pipeline.name}-pipeline.yml`
    const content = pipeline.pipeline_code || ""

    // Create a blob with the content
    const blob = new Blob([content], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <Button onClick={handleDownload} className="gap-2">
      <Download className="h-4 w-4" />
      Download
    </Button>
  )
}
