"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, Download, Code, FileText, PenTool, FileCode } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import MermaidDiagram from "@/components/mermaid-diagram" // Fixed import

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function FilesPage() {
  const [activeTab, setActiveTab] = useState("code")
  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load files based on the active tab
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true)
      setFiles([])
      setSelectedFile(null)

      try {
        let data: any[] = []
        let error: any = null

        // Fetch different types of files based on the active tab
        if (activeTab === "code") {
          // Fetch code from the code_generations table
          const result = await supabase.from("code_generations").select("*").order("created_at", { ascending: false })

          data = result.data || []
          error = result.error

          // Process the data to extract file names from requirements
          data = data.map((item) => {
            // Try to extract file name from requirements
            const fileNameMatch = item.requirements?.match(/File name: ([^\n]+)/)
            const fileName = fileNameMatch ? fileNameMatch[1] : `code_${item.id}.${item.language || "txt"}`

            return {
              ...item,
              fileName: fileName,
              fileType: "code",
              icon: <Code className="h-4 w-4 mr-2 flex-shrink-0" />,
            }
          })
        } else if (activeTab === "docs") {
          // Fetch specifications from the specifications table
          const specResult = await supabase.from("specifications").select("*").order("created_at", { ascending: false })

          const specData = specResult.data || []

          // Fetch designs from the designs table
          const designResult = await supabase.from("designs").select("*").order("created_at", { ascending: false })

          const designData = designResult.data || []

          // Process specifications
          const processedSpecs = specData.map((item) => ({
            ...item,
            fileName: `Specification: ${item.app_name || `spec_${item.id}`}`,
            fileType: "specification",
            icon: <FileText className="h-4 w-4 mr-2 flex-shrink-0" />,
          }))

          // Process designs
          const processedDesigns = designData.map((item) => ({
            ...item,
            fileName: `Design: ${item.type || `design_${item.id}`}`,
            fileType: "design",
            icon: <PenTool className="h-4 w-4 mr-2 flex-shrink-0" />,
          }))

          // Combine specifications and designs
          data = [...processedSpecs, ...processedDesigns]
        } else if (activeTab === "tests") {
          // Fetch test cases from the test_cases table
          const result = await supabase.from("test_cases").select("*").order("created_at", { ascending: false })

          data = result.data || []
          error = result.error

          // Process test cases
          data = data.map((item) => ({
            ...item,
            fileName: `Test Case: ${item.name || `test_${item.id}`}`,
            fileType: "test",
            icon: <FileCode className="h-4 w-4 mr-2 flex-shrink-0" />,
          }))
        }

        if (error) {
          throw error
        }

        setFiles(data)
      } catch (error) {
        console.error(`Error loading ${activeTab} files:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFiles()
  }, [activeTab, refreshTrigger])

  // Handle file selection
  const handleFileSelect = (file: any) => {
    setSelectedFile(file)
  }

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Function to download code as a file
  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Function to render file content based on file type
  const renderFileContent = () => {
    if (!selectedFile) return null

    if (selectedFile.fileType === "code") {
      return (
        <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-sm">
          <code>{selectedFile.generated_code}</code>
        </pre>
      )
    } else if (selectedFile.fileType === "design") {
      return (
        <div className="bg-white p-4 rounded-md overflow-auto max-h-[600px]">
          <MermaidDiagram code={selectedFile.diagram_code} />
        </div>
      )
    } else if (selectedFile.fileType === "specification") {
      // Render specification content
      return (
        <div className="bg-muted p-4 rounded-md overflow-auto max-h-[600px]">
          <h3 className="font-medium mb-2">App Name: {selectedFile.app_name}</h3>
          <h4 className="font-medium mb-2">App Type: {selectedFile.app_type}</h4>
          <p className="mb-4">{selectedFile.app_description}</p>

          {selectedFile.functional_requirements && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Functional Requirements:</h4>
              <pre className="text-sm whitespace-pre-wrap">{selectedFile.functional_requirements}</pre>
            </div>
          )}

          {selectedFile.non_functional_requirements && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Non-Functional Requirements:</h4>
              <pre className="text-sm whitespace-pre-wrap">{selectedFile.non_functional_requirements}</pre>
            </div>
          )}

          {selectedFile.system_architecture && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">System Architecture:</h4>
              <pre className="text-sm whitespace-pre-wrap">{selectedFile.system_architecture}</pre>
            </div>
          )}

          {selectedFile.database_schema && (
            <div>
              <h4 className="font-medium mb-1">Database Schema:</h4>
              <pre className="text-sm whitespace-pre-wrap">{selectedFile.database_schema}</pre>
            </div>
          )}
        </div>
      )
    } else if (selectedFile.fileType === "test") {
      // Render test case content
      return (
        <div className="bg-muted p-4 rounded-md overflow-auto max-h-[600px]">
          <h3 className="font-medium mb-2">Test Name: {selectedFile.name}</h3>
          <div className="mb-4">
            <h4 className="font-medium mb-1">Description:</h4>
            <p className="text-sm">{selectedFile.description}</p>
          </div>

          {selectedFile.test_code && (
            <div>
              <h4 className="font-medium mb-1">Test Code:</h4>
              <pre className="text-sm whitespace-pre-wrap">{selectedFile.test_code}</pre>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="bg-muted p-4 rounded-md">
        <p>Preview not available for this file type.</p>
      </div>
    )
  }

  // Function to get download content based on file type
  const getDownloadContent = () => {
    if (!selectedFile) return { content: "", fileName: "file.txt" }

    if (selectedFile.fileType === "code") {
      return {
        content: selectedFile.generated_code,
        fileName: selectedFile.fileName,
      }
    } else if (selectedFile.fileType === "design") {
      return {
        content: selectedFile.diagram_code,
        fileName: `${selectedFile.type || "design"}_${selectedFile.id}.mmd`,
      }
    } else if (selectedFile.fileType === "specification") {
      const content = `
App Name: ${selectedFile.app_name}
App Type: ${selectedFile.app_type}
App Description: ${selectedFile.app_description}

Functional Requirements:
${selectedFile.functional_requirements || "N/A"}

Non-Functional Requirements:
${selectedFile.non_functional_requirements || "N/A"}

System Architecture:
${selectedFile.system_architecture || "N/A"}

Database Schema:
${selectedFile.database_schema || "N/A"}
      `.trim()

      return {
        content,
        fileName: `specification_${selectedFile.id}.txt`,
      }
    } else if (selectedFile.fileType === "test") {
      const content = `
Test Name: ${selectedFile.name}
Description: ${selectedFile.description}

Test Code:
${selectedFile.test_code || "N/A"}
      `.trim()

      return {
        content,
        fileName: `test_${selectedFile.id}.txt`,
      }
    }

    return {
      content: JSON.stringify(selectedFile, null, 2),
      fileName: `file_${selectedFile.id}.json`,
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">File Management</h1>
        <p className="text-muted-foreground">View and manage files for your SDLC project</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-4">
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="docs">Documentation</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                  </TabsList>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                <TabsContent value="code">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Code Files</h3>
                    {renderFileList()}
                  </div>
                </TabsContent>

                <TabsContent value="tests">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Test Files</h3>
                    {renderFileList()}
                  </div>
                </TabsContent>

                <TabsContent value="docs">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Documentation Files</h3>
                    {renderFileList()}
                  </div>
                </TabsContent>

                <TabsContent value="other">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Other Files</h3>
                    <div className="text-center py-8 text-muted-foreground">Other files will be displayed here</div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {selectedFile && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{selectedFile.fileName}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const { content, fileName } = getDownloadContent()
                      downloadFile(content, fileName)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <CardDescription>
                  {selectedFile.fileType.charAt(0).toUpperCase() + selectedFile.fileType.slice(1)} • Created on{" "}
                  {new Date(selectedFile.created_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderFileContent()}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Files</CardTitle>
              <CardDescription>Create new files for your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/code-generation">
                <Button className="w-full">Code Generation</Button>
              </Link>
              <Link href="/design">
                <Button className="w-full" variant="outline">
                  Design Diagrams
                </Button>
              </Link>
              <Link href="/specification-generator">
                <Button className="w-full" variant="outline">
                  Specification Generator
                </Button>
              </Link>
              <Link href="/testing">
                <Button className="w-full" variant="outline">
                  Test Cases
                </Button>
              </Link>
            </CardContent>
          </Card>

          {selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle>File Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="capitalize">{selectedFile.fileType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                    <dd>{new Date(selectedFile.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">ID</dt>
                    <dd className="text-sm font-mono">{selectedFile.id}</dd>
                  </div>
                  {selectedFile.fileType === "code" && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Language</dt>
                        <dd>{selectedFile.language}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Framework</dt>
                        <dd>{selectedFile.framework}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )

  // Helper function to render the file list
  function renderFileList() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (files.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No files found</div>
    }

    return (
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={`${file.fileType}_${file.id}`}>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-2 px-3 text-left"
              onClick={() => handleFileSelect(file)}
            >
              {file.icon}
              <span className="truncate">{file.fileName}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(file.created_at).toLocaleDateString()}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    )
  }
}
