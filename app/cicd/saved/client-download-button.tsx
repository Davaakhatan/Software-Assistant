"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ClientDownloadButton({ pipelineCode, pipelineName }) {
  const handleDownload = () => {
    const blob = new Blob([pipelineCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${pipelineName.replace(/\s+/g, "-").toLowerCase()}.yml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" className="gap-1" onClick={handleDownload}>
      <Download className="h-3.5 w-3.5" />
      Download
    </Button>
  )
}
