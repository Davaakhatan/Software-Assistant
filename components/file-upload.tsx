"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface FileUploadProps {
  bucket: string
  path: string
  onUploadComplete?: (url: string) => void
}

export function FileUpload({ bucket, path, onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      // Upload file to Supabase Storage
      const filePath = `${path}/${file.name}`
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) {
        throw error
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      })

      // Call the callback with the public URL
      if (onUploadComplete) {
        onUploadComplete(urlData.publicUrl)
      }

      // Reset the file input
      setFile(null)
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error uploading file",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="file-upload">File</Label>
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
            className="w-full justify-start"
          >
            {file ? file.name : "Choose File"}
          </Button>
        </div>
      </div>

      <Button className="w-full" onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Uploading...
          </div>
        ) : (
          <div className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </div>
        )}
      </Button>
    </div>
  )
}
