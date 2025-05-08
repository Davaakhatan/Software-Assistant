"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { generateCode, generateFromSpecificationAndDesign, saveGeneratedCode } from "./actions"
import { Loader2, Code, Save, Copy, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CodeGenerationFormProps {
  specifications: any[]
  designs: any[]
}

export default function CodeGenerationForm({ specifications, designs }: CodeGenerationFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("fromSpecDesign")
  const [specId, setSpecId] = useState("")
  const [designId, setDesignId] = useState("")
  const [manualRequirements, setManualRequirements] = useState("")
  const [language, setLanguage] = useState("typescript")
  const [framework, setFramework] = useState("nextjs")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fileName, setFileName] = useState("")
  const [filteredDesigns, setFilteredDesigns] = useState<any[]>([])

  // Reset specId if the selected specification no longer exists
  useEffect(() => {
    if (specId && !specifications.some((spec) => spec.id === specId)) {
      setSpecId("")
      setFilteredDesigns([])
    }
  }, [specifications, specId])

  // Update filtered designs when specification changes
  const handleSpecificationChange = (id: string) => {
    setSpecId(id)
    console.log("Selected specification ID:", id)

    if (id) {
      console.log("Filtering designs for specification:", id)
      const relatedDesigns = designs.filter((design) => {
        // Check if the design is related to this specification
        const requirement = design.requirements
        return requirement && requirement.specification_id === id
      })
      console.log(`Found ${relatedDesigns.length} related designs`)
      setFilteredDesigns(relatedDesigns)
      setDesignId("") // Reset design selection
    } else {
      setFilteredDesigns([])
      setDesignId("")
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Force a refresh of the page data
    router.refresh()

    // Set a timeout to reset the refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data refreshed",
        description: "The specifications list has been refreshed",
      })
    }, 1000)
  }

  const handleGenerate = async () => {
    if (activeTab === "fromSpecDesign" && !specId) {
      toast({
        title: "Error",
        description: "Please select a specification",
        variant: "destructive",
      })
      return
    }

    if (activeTab === "manual" && !manualRequirements.trim()) {
      toast({
        title: "Error",
        description: "Please enter requirements",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      console.log("Starting code generation with:", {
        activeTab,
        specId,
        designId,
        language,
        framework,
        manualRequirements: manualRequirements ? "provided" : "not provided",
      })

      let result
      if (activeTab === "fromSpecDesign") {
        result = await generateFromSpecificationAndDesign(specId, designId, language, framework)
      } else {
        result = await generateCode(language, framework, manualRequirements)
      }

      console.log("Generation result:", {
        success: result.success,
        hasCode: !!result.code,
        hasFallback: !!result.fallbackCode,
        error: result.error,
      })

      if (result.success) {
        setGeneratedCode(result.code)

        // Set a default file name based on the selected options
        const specName = specifications.find((spec) => spec.id === specId)?.app_name || "app"
        const fileExtension = language === "typescript" ? ".ts" : language === "javascript" ? ".js" : ".txt"
        setFileName(`${specName.toLowerCase().replace(/\s+/g, "-")}${fileExtension}`)

        // Check if this was a fallback response
        if (result.fallback) {
          toast({
            title: "Fallback code generated",
            description: "The AI service timed out. We've provided fallback code instead.",
            variant: "warning",
          })
        } else {
          toast({
            title: "Code generated",
            description: "Your code has been generated successfully",
          })
        }
      } else {
        setGeneratedCode(result.fallbackCode || "// Error generating code")

        toast({
          title: "Error",
          description: result.error || "Failed to generate code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating code:", error)
      setGeneratedCode(
        "// Error occurred during code generation\n// " + (error instanceof Error ? error.message : String(error)),
      )
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedCode) {
      toast({
        title: "Error",
        description: "No code to save. Please generate code first.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await saveGeneratedCode(
        generatedCode,
        language,
        framework,
        activeTab === "manual" ? manualRequirements : "Generated from specification and design",
        activeTab === "fromSpecDesign" ? specId : undefined,
        activeTab === "fromSpecDesign" ? designId : undefined,
      )

      if (result.success) {
        toast({
          title: "Code saved",
          description: "Your generated code has been saved successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving code:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    })
  }

  const handleDownload = () => {
    if (!generatedCode) return

    const blob = new Blob([generatedCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || `code.${language === "typescript" ? "ts" : "js"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Code downloaded successfully",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Generate Code</CardTitle>
              <CardDescription>Generate code from specifications, designs, or custom requirements</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fromSpecDesign">From Specification & Design</TabsTrigger>
              <TabsTrigger value="manual">Enter Requirements Manually</TabsTrigger>
            </TabsList>

            <TabsContent value="fromSpecDesign" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specification">Specification</Label>
                  <Select value={specId} onValueChange={handleSpecificationChange}>
                    <SelectTrigger id="specification">
                      <SelectValue placeholder="Select a specification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {specifications.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {spec.app_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {specifications.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No specifications available. Please create a specification first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="design">Design (Optional)</Label>
                  <Select
                    value={designId}
                    onValueChange={setDesignId}
                    disabled={!specId || filteredDesigns.length === 0}
                  >
                    <SelectTrigger id="design">
                      <SelectValue
                        placeholder={filteredDesigns.length === 0 ? "No designs available" : "Select a design"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Fixed: Changed empty string to "no_design" */}
                      <SelectItem value="no_design">None</SelectItem>
                      {filteredDesigns.map((design) => (
                        <SelectItem key={design.id} value={design.id}>
                          {design.type === "architecture"
                            ? "System Architecture"
                            : design.type === "data-model"
                              ? "Data Model"
                              : "Component Diagram"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="language-spec">Programming Language</Label>
                  <Select value={language} onValueChange={setLanguage} defaultValue={language}>
                    <SelectTrigger id="language-spec">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="framework-spec">Framework</Label>
                  <Select value={framework} onValueChange={setFramework} defaultValue={framework}>
                    <SelectTrigger id="framework-spec">
                      <SelectValue placeholder="Select a framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nextjs">Next.js</SelectItem>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="express">Express.js</SelectItem>
                      <SelectItem value="django">Django</SelectItem>
                      <SelectItem value="spring">Spring Boot</SelectItem>
                      <SelectItem value="aspnet">ASP.NET Core</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Enter your requirements here..."
                  className="min-h-[150px]"
                  value={manualRequirements}
                  onChange={(e) => setManualRequirements(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="language-manual">Programming Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language-manual">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="framework-manual">Framework</Label>
                  <Select value={framework} onValueChange={setFramework} defaultValue={framework}>
                    <SelectTrigger id="framework-manual">
                      <SelectValue placeholder="Select a framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nextjs">Next.js</SelectItem>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="express">Express.js</SelectItem>
                      <SelectItem value="django">Django</SelectItem>
                      <SelectItem value="spring">Spring Boot</SelectItem>
                      <SelectItem value="aspnet">ASP.NET Core</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (activeTab === "fromSpecDesign" && !specId)}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
            <CardDescription>Review, save, or download your generated code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="file-name">File Name</Label>
                <Input
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                />
              </div>
              <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-sm font-mono">
                {generatedCode}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
