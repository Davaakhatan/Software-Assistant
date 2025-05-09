"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadCloud, X, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ServerFileUploadProps {
  bucket: string
  path?: string
  onUploadComplete?: (url: string) => void
  onUploadError?: (error: string) => void
  accept?: string
  maxSize?: number // in bytes
}

export function ServerFileUpload({
  bucket,
  path = "",
  onUploadComplete,
  onUploadError,
  accept = ".js,.jsx,.ts,.tsx,.vue,.svelte",
  maxSize = 5 * 1024 * 1024, // 5MB default
}: ServerFileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError(null)

    if (!selectedFile) {
      return
    }

    // Check file size
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds the maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`)
      return
    }

    setFile(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) {
      return
    }

    // Check file size
    if (droppedFile.size > maxSize) {
      setError(`File size exceeds the maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`)
      return
    }

    setFile(droppedFile)
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setUploading(true)
    setError(null)
    setProgress(10) // Start progress

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", bucket)
      formData.append("path", path)

      setProgress(30) // Update progress

      const response = await fetch("/api/file-upload", {
        method: "POST",
        body: formData,
      })

      setProgress(90) // Almost done

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload file")
      }

      setProgress(100) // Complete

      // Call the onUploadComplete callback with the file URL
      if (onUploadComplete) {
        onUploadComplete(result.url)
      }

      // Clear the file after successful upload
      clearFile()
    } catch (error) {
      console.error("Error uploading file:", error)
      setError(error instanceof Error ? error.message : "Failed to upload file")
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : "Failed to upload file")
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          file ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!file ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Click to upload</span> or drag and drop
            </div>
            <div className="text-xs text-muted-foreground">
              {accept.split(",").join(", ")} (Max {Math.round(maxSize / 1024 / 1024)}MB)
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-2">
              Select File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <FileText className="h-10 w-10 text-primary" />
            <div className="text-sm font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={clearFile} className="flex items-center">
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <Button size="sm" onClick={uploadFile} disabled={uploading} className="flex items-center">
                <UploadCloud className="h-4 w-4 mr-1" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {uploading && (
        <div className="w-full bg-muted rounded-full h-2.5 mt-2">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}
