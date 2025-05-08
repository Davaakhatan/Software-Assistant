"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

export default function DownloadButton({ pipeline }) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Get the pipeline code from either pipeline_code or generated_config
      const pipelineCode = pipeline.pipeline_code || pipeline.generated_config || ""

      // Create a blob and download it
      const blob = new Blob([pipelineCode], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      // Use name or project_name for the filename
      const filename = (pipeline.name || pipeline.project_name || "pipeline").replace(/\s+/g, "-").toLowerCase()

      // Determine the file extension based on the pipeline type
      let extension = ".yml"
      if ((pipeline.pipeline_type || pipeline.platform || "").toLowerCase().includes("jenkins")) {
        extension = ".jenkinsfile"
      }

      a.download = `${filename}${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Pipeline downloaded",
        description: "The pipeline configuration has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading pipeline:", error)
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error downloading the pipeline configuration.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="gap-2">
      <Download className="h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download"}
    </Button>
  )
}
