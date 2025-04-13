"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wand2, Save, Loader2, AlertCircle, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAIProvider } from "@/context/ai-provider-context"
import Link from "next/link"
import { saveSpecification } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { generateAIText } from "@/lib/ai-service-client"
import { useRouter } from "next/navigation"

export function SpecificationGenerator() {
  const { toast } = useToast()
  const router = useRouter()
  const { temperature } = useAIProvider()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [appName, setAppName] = useState("")
  const [appType, setAppType] = useState("web")
  const [appComplexity, setAppComplexity] = useState("simple")
  const [appDescription, setAppDescription] = useState("")
  const [activeTab, setActiveTab] = useState("description")
  const [generatedSpecification, setGeneratedSpecification] = useState({
    functional_requirements: "",
    non_functional_requirements: "",
    system_architecture: "",
    database_schema: "",
    api_endpoints: "",
    user_stories: "",
  })
  const [hasGenerated, setHasGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(false)

  // Check for available API key on component mount and when localStorage changes
  useEffect(() => {
    const checkApiKey = () => {
      if (typeof window !== "undefined") {
        const key = localStorage.getItem("openai_api_key") || ""
        setHasApiKey(!!key && key.startsWith("sk-"))
      }
    }

    // Check initially
    checkApiKey()

    // Set up event listener for localStorage changes
    const handleStorageChange = () => {
      checkApiKey()
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check when the component gains focus
    window.addEventListener("focus", checkApiKey)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", checkApiKey)
    }
  }, [])

  // Let's also improve the handleGenerate function to better handle the AI response:

  const handleGenerate = async () => {
    setError(null)

    if (!appName) {
      toast({
        title: "Error",
        description: "Please enter an app name",
        variant: "destructive",
      })
      return
    }

    if (!appDescription) {
      toast({
        title: "Error",
        description: "Please enter an app description",
        variant: "destructive",
      })
      return
    }

    // Check if API key is available
    if (!hasApiKey) {
      setError("No valid OpenAI API key found. Please configure your API key in Settings.")
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key in Settings",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
            Go to Settings
          </Button>
        ),
      })
      return
    }

    setIsGenerating(true)

    try {
      // Create the prompt for the AI
      const prompt = `Generate a comprehensive software specification for a ${appComplexity} ${appType} application named "${appName}".

Description: ${appDescription}

Please generate the following sections with clear headings:
1. Functional Requirements
2. Non-Functional Requirements
3. System Architecture
4. Database Schema
5. API Endpoints
6. User Stories

Format each section with Markdown headings (e.g., # Functional Requirements) and bullet points for clarity.`

      // Create a system prompt for the AI
      const systemPrompt = `You are an expert software architect and requirements analyst.
Your task is to create a detailed software specification based on the provided information.
Structure your response with clear sections using Markdown headings (# Section Title).
Be specific, practical, and thorough in your specification.
Always include all six requested sections, even if brief.`

      // Generate the specification using AI
      const result = await generateAIText(prompt, systemPrompt, {
        temperature,
      })

      if (!result.success || !result.text) {
        throw new Error(result.error || "Failed to generate specification")
      }

      console.log("AI Response:", result.text) // Add this for debugging

      // Parse the generated text into sections
      const sections = parseGeneratedText(result.text)

      console.log("Parsed Sections:", sections) // Add this for debugging

      setGeneratedSpecification(sections)
      setIsGenerating(false)
      setHasGenerated(true)
      setActiveTab("functional")

      toast({
        title: "Specification generated",
        description: "Generated using OpenAI",
      })
    } catch (error) {
      console.error("Error generating specification:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate specification",
        variant: "destructive",
      })
      setIsGenerating(false)
    }
  }

  // Helper function to parse the generated text into sections
  const parseGeneratedText = (text: string) => {
    const sections = {
      functional_requirements: "",
      non_functional_requirements: "",
      system_architecture: "",
      database_schema: "",
      api_endpoints: "",
      user_stories: "",
    }

    try {
      // Look for each section in the text using more flexible regex patterns
      const functionalMatch = text.match(
        /(?:# |## |### )?Functional Requirements[\s\S]*?(?=(?:# |## |### )?Non-Functional Requirements|$)/i,
      )
      const nonFunctionalMatch = text.match(
        /(?:# |## |### )?Non-Functional Requirements[\s\S]*?(?=(?:# |## |### )?System Architecture|$)/i,
      )
      const architectureMatch = text.match(
        /(?:# |## |### )?System Architecture[\s\S]*?(?=(?:# |## |### )?Database Schema|$)/i,
      )
      const databaseMatch = text.match(/(?:# |## |### )?Database Schema[\s\S]*?(?=(?:# |## |### )?API Endpoints|$)/i)
      const apiMatch = text.match(/(?:# |## |### )?API Endpoints[\s\S]*?(?=(?:# |## |### )?User Stories|$)/i)
      const userStoriesMatch = text.match(/(?:# |## |### )?User Stories[\s\S]*?(?=$)/i)

      // Assign the matched sections
      if (functionalMatch) sections.functional_requirements = functionalMatch[0].trim()
      if (nonFunctionalMatch) sections.non_functional_requirements = nonFunctionalMatch[0].trim()
      if (architectureMatch) sections.system_architecture = architectureMatch[0].trim()
      if (databaseMatch) sections.database_schema = databaseMatch[0].trim()
      if (apiMatch) sections.api_endpoints = apiMatch[0].trim()
      if (userStoriesMatch) sections.user_stories = userStoriesMatch[0].trim()

      // If no sections were found, try to parse the text in a different way
      if (
        !functionalMatch &&
        !nonFunctionalMatch &&
        !architectureMatch &&
        !databaseMatch &&
        !apiMatch &&
        !userStoriesMatch
      ) {
        // Split by double newlines to find sections
        const paragraphs = text.split("\n\n")

        // Try to categorize paragraphs based on content
        for (const paragraph of paragraphs) {
          if (/functional requirement|user can|system should/i.test(paragraph)) {
            sections.functional_requirements += paragraph + "\n\n"
          } else if (/performance|security|reliability|usability|non-functional/i.test(paragraph)) {
            sections.non_functional_requirements += paragraph + "\n\n"
          } else if (/architecture|component|layer|tier|frontend|backend/i.test(paragraph)) {
            sections.system_architecture += paragraph + "\n\n"
          } else if (/database|schema|table|entity|relation/i.test(paragraph)) {
            sections.database_schema += paragraph + "\n\n"
          } else if (/api|endpoint|route|get|post|put|delete/i.test(paragraph)) {
            sections.api_endpoints += paragraph + "\n\n"
          } else if (/user stor|as a user|as an admin/i.test(paragraph)) {
            sections.user_stories += paragraph + "\n\n"
          }
        }
      }

      // If still no content, put everything in functional requirements
      if (
        !sections.functional_requirements &&
        !sections.non_functional_requirements &&
        !sections.system_architecture &&
        !sections.database_schema &&
        !sections.api_endpoints &&
        !sections.user_stories
      ) {
        sections.functional_requirements = text
      }

      return sections
    } catch (error) {
      console.error("Error parsing generated text:", error)
      // If parsing fails, put everything in functional requirements
      return {
        ...sections,
        functional_requirements: text,
      }
    }
  }

  const handleSave = async () => {
    if (!hasGenerated) {
      toast({
        title: "Error",
        description: "Please generate a specification first",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Create the specification object to save
      const specificationToSave = {
        app_name: appName,
        app_type: appType,
        app_description: appDescription,
        ...generatedSpecification,
      }

      // Call the server action to save the specification
      const result = await saveSpecification(specificationToSave)

      if (result.success) {
        // Show success toast
        toast({
          title: "Saved!",
          description: "Your specification has been saved successfully",
          duration: 1500, // 1.5 seconds
        })
      } else {
        // Show error toast if the server action returned an error
        toast({
          title: "Error",
          description: result.error || "Failed to save specification",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      // Show error toast if something goes wrong
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save specification",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g., Calculator"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="app-type">App Type</Label>
                <Select value={appType} onValueChange={setAppType}>
                  <SelectTrigger id="app-type" className="mt-1">
                    <SelectValue placeholder="Select app type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web Application</SelectItem>
                    <SelectItem value="mobile">Mobile Application</SelectItem>
                    <SelectItem value="desktop">Desktop Application</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="blog">Blog/CMS</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6">
              <Label htmlFor="app-complexity">App Complexity</Label>
              <Select value={appComplexity} onValueChange={setAppComplexity}>
                <SelectTrigger id="app-complexity" className="mt-1">
                  <SelectValue placeholder="Select app complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (To-do list, Weather app)</SelectItem>
                  <SelectItem value="medium">Medium (Blog, E-commerce)</SelectItem>
                  <SelectItem value="complex">Complex (Social network, Enterprise app)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This will adjust the level of detail in your generated specification.
              </p>
            </div>

            <div className="mb-6">
              <Label htmlFor="app-description">App Description</Label>
              <Textarea
                id="app-description"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder="Describe your app's purpose, target users, and main features..."
                className="mt-1 h-32"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!hasApiKey && (
              <Alert variant="warning" className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Key Required</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>You need to configure an OpenAI API key to use AI features.</p>
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push("/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Settings
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end mb-6">
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Specification
                  </>
                )}
              </Button>
            </div>

            {hasGenerated && (
              <>
                <div className="mb-4">
                  <div className="grid grid-cols-7 gap-1 w-full">
                    <button
                      onClick={() => setActiveTab("description")}
                      className={`px-2 py-1.5 text-sm font-medium rounded-md ${
                        activeTab === "description"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      Description
                    </button>
                    <button
                      onClick={() => setActiveTab("functional")}
                      className={`px-2 py-1.5 text-sm font-medium rounded-md ${
                        activeTab === "functional" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      Functional
                    </button>
                    <button
                      onClick={() => setActiveTab("non-func")}
                      className={`px-2 py-1.5 text-sm font-medium rounded-md ${
                        activeTab === "non-func" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      Non-Func
                    </button>
                    <button
                      onClick={() => setActiveTab("architecture")}
                      className={`px-2 py-1.5 text-sm font-medium rounded-md ${
                        activeTab === "architecture"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      Architecture
                    </button>
                    <button
                      onClick={() => setActiveTab("database")}
                      className={`px-2 py-1.5 text-sm font-medium rounded-md ${
                        activeTab === "database" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      Database
                    </button>
                    <button
                      onClick={() => setActiveTab("api")}
                      className={`px-2 py-1.5 text-sm font-medium rounded-md ${
                        activeTab === "api" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      API
                    </button>
                    <button
                      onClick={() => setActiveTab("user-stories")}
                      className={`px-2 py-1.5 text-sm font-medium rounded-md ${
                        activeTab === "user-stories"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      User Stories
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {activeTab === "description" && (
                    <div className="space-y-4">
                      <div>
                        <Label>App Name</Label>
                        <div className="mt-1 p-2 bg-muted rounded-md">{appName}</div>
                      </div>
                      <div>
                        <Label>App Type</Label>
                        <div className="mt-1 p-2 bg-muted rounded-md">{appType}</div>
                      </div>
                      <div>
                        <Label>App Description</Label>
                        <div className="mt-1 p-2 bg-muted rounded-md whitespace-pre-wrap">{appDescription}</div>
                      </div>
                    </div>
                  )}

                  {activeTab === "functional" && (
                    <div>
                      <Label>Functional Requirements</Label>
                      <div className="mt-1">
                        {isGenerating ? (
                          <div className="flex items-center justify-center p-4 border rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Generating...</span>
                          </div>
                        ) : generatedSpecification.functional_requirements ? (
                          <div className="relative">
                            <Textarea
                              value={generatedSpecification.functional_requirements}
                              onChange={(e) =>
                                setGeneratedSpecification({
                                  ...generatedSpecification,
                                  functional_requirements: e.target.value,
                                })
                              }
                              className="mt-1 h-72 font-mono text-sm"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Copy to clipboard"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedSpecification.functional_requirements)
                                  toast({
                                    title: "Copied!",
                                    description: "Content copied to clipboard",
                                    duration: 1500,
                                  })
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-copy"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-12 border rounded-md text-muted-foreground">
                            <p>No functional requirements generated yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "non-func" && (
                    <div>
                      <Label>Non-Functional Requirements</Label>
                      <div className="mt-1">
                        {isGenerating ? (
                          <div className="flex items-center justify-center p-4 border rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Generating...</span>
                          </div>
                        ) : generatedSpecification.non_functional_requirements ? (
                          <div className="relative">
                            <Textarea
                              value={generatedSpecification.non_functional_requirements}
                              onChange={(e) =>
                                setGeneratedSpecification({
                                  ...generatedSpecification,
                                  non_functional_requirements: e.target.value,
                                })
                              }
                              className="mt-1 h-72 font-mono text-sm"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Copy to clipboard"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedSpecification.non_functional_requirements)
                                  toast({
                                    title: "Copied!",
                                    description: "Content copied to clipboard",
                                    duration: 1500,
                                  })
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-copy"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-12 border rounded-md text-muted-foreground">
                            <p>No non-functional requirements generated yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "architecture" && (
                    <div>
                      <Label>System Architecture</Label>
                      <div className="mt-1">
                        {isGenerating ? (
                          <div className="flex items-center justify-center p-4 border rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Generating...</span>
                          </div>
                        ) : generatedSpecification.system_architecture ? (
                          <div className="relative">
                            <Textarea
                              value={generatedSpecification.system_architecture}
                              onChange={(e) =>
                                setGeneratedSpecification({
                                  ...generatedSpecification,
                                  system_architecture: e.target.value,
                                })
                              }
                              className="mt-1 h-72 font-mono text-sm"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Copy to clipboard"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedSpecification.system_architecture)
                                  toast({
                                    title: "Copied!",
                                    description: "Content copied to clipboard",
                                    duration: 1500,
                                  })
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-copy"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-12 border rounded-md text-muted-foreground">
                            <p>No system architecture generated yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "database" && (
                    <div>
                      <Label>Database Schema</Label>
                      <div className="mt-1">
                        {isGenerating ? (
                          <div className="flex items-center justify-center p-4 border rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Generating...</span>
                          </div>
                        ) : generatedSpecification.database_schema ? (
                          <div className="relative">
                            <Textarea
                              value={generatedSpecification.database_schema}
                              onChange={(e) =>
                                setGeneratedSpecification({
                                  ...generatedSpecification,
                                  database_schema: e.target.value,
                                })
                              }
                              className="mt-1 h-72 font-mono text-sm"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Copy to clipboard"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedSpecification.database_schema)
                                  toast({
                                    title: "Copied!",
                                    description: "Content copied to clipboard",
                                    duration: 1500,
                                  })
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-copy"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-12 border rounded-md text-muted-foreground">
                            <p>No database schema generated yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "api" && (
                    <div>
                      <Label>API Endpoints</Label>
                      <div className="mt-1">
                        {isGenerating ? (
                          <div className="flex items-center justify-center p-4 border rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Generating...</span>
                          </div>
                        ) : generatedSpecification.api_endpoints ? (
                          <div className="relative">
                            <Textarea
                              value={generatedSpecification.api_endpoints}
                              onChange={(e) =>
                                setGeneratedSpecification({
                                  ...generatedSpecification,
                                  api_endpoints: e.target.value,
                                })
                              }
                              className="mt-1 h-72 font-mono text-sm"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Copy to clipboard"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedSpecification.api_endpoints)
                                  toast({
                                    title: "Copied!",
                                    description: "Content copied to clipboard",
                                    duration: 1500,
                                  })
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-copy"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-12 border rounded-md text-muted-foreground">
                            <p>No API endpoints generated yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "user-stories" && (
                    <div>
                      <Label>User Stories</Label>
                      <div className="mt-1">
                        {isGenerating ? (
                          <div className="flex items-center justify-center p-4 border rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Generating...</span>
                          </div>
                        ) : generatedSpecification.user_stories ? (
                          <div className="relative">
                            <Textarea
                              value={generatedSpecification.user_stories}
                              onChange={(e) =>
                                setGeneratedSpecification({
                                  ...generatedSpecification,
                                  user_stories: e.target.value,
                                })
                              }
                              className="mt-1 h-72 font-mono text-sm"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Copy to clipboard"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedSpecification.user_stories)
                                  toast({
                                    title: "Copied!",
                                    description: "Content copied to clipboard",
                                    duration: 1500,
                                  })
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-copy"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-12 border rounded-md text-muted-foreground">
                            <p>No user stories generated yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Specification"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-medium">Specification Tips</h3>
              <p className="text-sm text-muted-foreground">
                Be specific about your app's features and target audience to get better results.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Complexity Matters</h3>
              <p className="text-sm text-muted-foreground">
                Choose the right complexity level to get appropriate detail in your specification.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Review & Edit</h3>
              <p className="text-sm text-muted-foreground">
                Always review and customize the generated specification to match your exact needs.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-2">Next Steps</h3>
            <p className="text-sm text-muted-foreground mb-4">
              After creating your specification, you can move on to system design or code generation.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/design">
                <Button variant="outline" className="w-full justify-start">
                  System Design
                </Button>
              </Link>
              <Link href="/code-generation">
                <Button variant="outline" className="w-full justify-start">
                  Code Generation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
