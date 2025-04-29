"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, Download, Code, FileCode, GitBranch, GitPullRequest, BookOpen } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import MermaidDiagram from "@/components/mermaid-diagram"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a singleton client to avoid multiple instances
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

export default function FilesPage() {
  const [activeTab, setActiveTab] = useState("cicd") // Set default tab to CI/CD for testing
  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Load files based on the active tab
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true)
      setFiles([])
      setSelectedFile(null)
      setError(null)

      try {
        let data: any[] = []

        // Fetch different types of files based on the active tab
        if (activeTab === "code") {
          // Fetch code from the code_generations table
          const result = await supabase.from("code_generations").select("*").order("created_at", { ascending: false })

          if (result.error) {
            console.error("Error fetching code generations:", result.error)
            throw result.error
          }

          data = result.data || []

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
          // Fetch documentation from the documentations table
          const { data: docsData, error: docsError } = await supabase
            .from("documentations")
            .select("*")
            .order("created_at", { ascending: false })

          if (docsError) {
            throw docsError
          }

          data = docsData || []

          // Function to fetch app_name from specifications table
          const fetchAppName = async (projectId) => {
            if (!projectId) return null
            const { data: specData, error: specError } = await supabase
              .from("specifications")
              .select("app_name")
              .eq("id", projectId)
              .single()

            if (specError) {
              console.error("Error fetching specification:", specError)
              return null
            }

            return specData?.app_name || null
          }

          // Process documentation
          data = await Promise.all(
            data.map(async (item) => {
              const appName = await fetchAppName(item.project_id)
              return {
                ...item,
                fileName: `Doc: ${item.project_name || `doc_${item.id}`} (${item.doc_type || "general"})`,
                fileType: "documentation",
                icon: <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />,
                appName: appName, // Add appName to the item
              }
            }),
          )
        } else if (activeTab === "tests") {
          // Fetch test cases from the test_cases table
          const result = await supabase.from("test_cases").select("*").order("created_at", { ascending: false })

          if (result.error) {
            throw result.error
          }

          data = result.data || []

          // Process test cases
          data = data.map((item) => ({
            ...item,
            fileName: `Test Case: ${item.name || `test_${item.id}`}`,
            fileType: "test",
            icon: <FileCode className="h-4 w-4 mr-2 flex-shrink-0" />,
          }))
        } else if (activeTab === "cicd") {
          // Fetch CI/CD pipelines from the ci_cd_pipelines table
          const { data: pipelineData, error: pipelineError } = await supabase.from("ci_cd_pipelines").select("*")

          if (pipelineError) {
            throw pipelineError
          }

          data = pipelineData || []

          // Process CI/CD pipelines
          data = data.map((item) => {
            // Determine the appropriate icon based on the platform
            let icon = <GitBranch className="h-4 w-4 mr-2 flex-shrink-0" />
            if (item.platform === "github") {
              icon = <GitPullRequest className="h-4 w-4 mr-2 flex-shrink-0" />
            }

            return {
              ...item,
              fileName: `Pipeline: ${item.project_name || `pipeline_${item.id}`} (${item.platform || "unknown"})`,
              fileType: "cicd",
              icon: icon,
            }
          })
        } else if (activeTab === "documentation") {
          // Fetch documentation from the documentations table
          const { data: docsData, error: docsError } = await supabase
            .from("documentations")
            .select("*")
            .order("created_at", { ascending: false })

          if (docsError) {
            throw docsError
          }

          data = docsData || []

          // Process documentation
          data = data.map((item) => ({
            ...item,
            fileName: `Doc: ${item.project_name || `doc_${item.id}`} (${item.doc_type || "general"})`,
            fileType: "documentation",
            icon: <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />,
          }))
        }

        setFiles(data)
      } catch (err: any) {
        console.error(`Error loading ${activeTab} files:`, err)
        setError(err.message || "Failed to load files")
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
    } else if (selectedFile.fileType === "cicd") {
      return (
        <div>
          <div className="mb-4">
            <h4 className="font-medium mb-1">
              Platform: <span className="capitalize">{selectedFile.platform || "Unknown"}</span>
            </h4>
            <p className="text-sm">Project: {selectedFile.project_name || "Unnamed Project"}</p>
          </div>
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[600px] text-sm">
            <code>{selectedFile.generated_config || "No configuration available"}</code>
          </pre>
        </div>
      )
    } else if (selectedFile.fileType === "documentation") {
      return (
        <div className="bg-muted p-4 rounded-md overflow-auto max-h-[600px]">
          <h3 className="font-medium mb-2">Documentation: {selectedFile.project_name || "Untitled"}</h3>
          <h4 className="font-medium mb-2">Type: {selectedFile.doc_type || "General"}</h4>

          {selectedFile.project_description && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Project Description:</h4>
              <p className="text-sm">{selectedFile.project_description}</p>
            </div>
          )}

          {selectedFile.generated_docs && (
            <div>
              <h4 className="font-medium mb-1">Documentation Content:</h4>
              <pre className="text-sm whitespace-pre-wrap">{selectedFile.generated_docs}</pre>
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

  // Helper function to get download content based on file type
  const getDownloadContent = () => {
    if (!selectedFile) return { content: "", fileName: "file.txt" }

    if (selectedFile.fileType === "code") {
      return {
        content: selectedFile.generated_code || "// No code available",
        fileName: selectedFile.fileName || "code.txt",
      }
    } else if (selectedFile.fileType === "design") {
      return {
        content: selectedFile.diagram_code || "// No diagram code available",
        fileName: `${selectedFile.type || "design"}_${selectedFile.id}.mmd`,
      }
    } else if (selectedFile.fileType === "specification") {
      const content = `
App Name: ${selectedFile.app_name || "Untitled"}
App Type: ${selectedFile.app_type || "Unknown"}
App Description: ${selectedFile.app_description || "No description"}

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
Test Name: ${selectedFile.name || "Untitled Test"}
Description: ${selectedFile.description || "No description"}

Test Code:
${selectedFile.test_code || "N/A"}
      `.trim()

      return {
        content,
        fileName: `test_${selectedFile.id}.txt`,
      }
    } else if (selectedFile.fileType === "cicd") {
      const extension = selectedFile.platform === "github" ? "yml" : "yml"
      return {
        content: selectedFile.generated_config || "# No configuration available",
        fileName: `${selectedFile.project_name || "pipeline"}_${selectedFile.platform || "ci"}.${extension}`,
      }
    } else if (selectedFile.fileType === "documentation") {
      const content = `
# ${selectedFile.project_name || "Untitled Documentation"}
Type: ${selectedFile.doc_type || "General"}
Created: ${new Date(selectedFile.created_at).toLocaleString()}

## Project Description
${selectedFile.project_description || "No description available"}

## Documentation Content
${selectedFile.generated_docs || "No content available"}
      `.trim()

      return {
        content,
        fileName: `documentation_${selectedFile.id}.md`,
      }
    }

    return {
      content: JSON.stringify(selectedFile, null, 2),
      fileName: `file_${selectedFile.id}.json`,
    }
  }

  const renderFileList = () => {
    return (
      <div>
        {isLoading && <p>Loading files...</p>}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-medium text-red-800 mb-2">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50"
            onClick={() => handleFileSelect(file)}
          >
            <div className="flex items-center">
              {file.icon}
              <span>{file.fileName}</span>
            </div>
            <span className="text-xs text-gray-500">{new Date(file.created_at).toLocaleDateString()}</span>
          </div>
        ))}
        {!isLoading && files.length === 0 && !error && <p>No files found.</p>}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">File Management</h1>
        <p className="text-muted-foreground">View and manage files for your SDLC project</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-4">
                  <TabsList className="grid w-auto" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="docs">Designs</TabsTrigger>
                    <TabsTrigger value="cicd">CI/CD</TabsTrigger>
                    <TabsTrigger value="documentation">Docs</TabsTrigger>
                  </TabsList>
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
                    <h3 className="text-lg font-medium mb-4">Design Files</h3>
                    {renderFileList()}
                  </div>
                </TabsContent>

                <TabsContent value="cicd">
                  <div>
                    <h3 className="text-lg font-medium mb-4">CI/CD Pipeline Files</h3>
                    {renderFileList()}

                    {error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <h4 className="font-medium text-red-800 mb-2">Error</h4>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documentation">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Documentation Files</h3>
                    {renderFileList()}

                    {error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <h4 className="font-medium text-red-800 mb-2">Error</h4>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}
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
              <Link href="/cicd">
                <Button className="w-full" variant="outline">
                  CI/CD Pipelines
                </Button>
              </Link>
              <Link href="/documentation">
                <Button className="w-full" variant="outline">
                  Documentation
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
