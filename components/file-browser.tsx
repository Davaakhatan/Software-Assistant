"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileIcon, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getSupabase } from "@/lib/supabase"

interface FileBrowserProps {
  bucket: string
  path?: string
  title?: string
  onFileSelect?: (url: string, name: string) => void
  refreshTrigger?: number
}

export function FileBrowser({
  bucket,
  path = "",
  title = "Files",
  onFileSelect,
  refreshTrigger = 0,
}: FileBrowserProps) {
  const [files, setFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Use useCallback to memoize the loadFiles function
  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabase()
      console.log(`Loading files from bucket: ${bucket}, path: ${path}`)

      // List all files in the bucket with the specified path
      const { data, error } = await supabase.storage.from(bucket).list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      })

      if (error) {
        throw error
      }

      // Get public URLs for all files
      const filesWithUrls = await Promise.all(
        (data || [])
          .filter((item) => !item.name.endsWith("/")) // Filter out folders
          .map(async (file) => {
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(`${path ? `${path}/` : ""}${file.name}`)
            return {
              ...file,
              url: urlData.publicUrl,
            }
          }),
      )

      setFiles(filesWithUrls)
    } catch (error) {
      console.error("Error loading files:", error)
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [bucket, path])

  useEffect(() => {
    loadFiles()
  }, [loadFiles, refreshTrigger])

  const handleDelete = async (fileName: string) => {
    setIsDeleting(fileName)
    try {
      const supabase = getSupabase()
      const filePath = `${path ? `${path}/` : ""}${fileName}`
      const { error } = await supabase.storage.from(bucket).remove([filePath])

      if (error) {
        throw error
      }

      toast({
        title: "File deleted",
        description: "The file has been deleted successfully",
      })
      loadFiles()
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error deleting file",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleFileClick = (url: string, fileName: string) => {
    if (onFileSelect) {
      onFileSelect(url, fileName)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No files found</div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.name} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <button
                  className="flex items-center flex-1 text-left truncate"
                  onClick={() => handleFileClick(file.url, file.name)}
                >
                  <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(file.url, "_blank")
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(file.name)
                    }}
                    disabled={isDeleting === file.name}
                  >
                    {isDeleting === file.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
