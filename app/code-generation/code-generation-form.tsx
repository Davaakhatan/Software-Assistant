"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Code } from "lucide-react"
import { generateCode, generateFromSpecificationAndDesign, saveGeneratedCode } from "./actions"

interface Specification {
  id: string
  app_name: string
}

interface Design {
  id: string
  type: string
  name?: string
}

export default function CodeGenerationForm() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("fromSpec")
  const [specifications, setSpecifications] = useState<Specification[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [selectedSpecification, setSelectedSpecification] = useState<string>("")
  const [selectedDesign, setSelectedDesign] = useState<string>("")
  const [language, setLanguage] = useState<string>("TypeScript")
  const [framework, setFramework] = useState<string>("Next.js")
  const [requirements, setRequirements] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch specifications
    const fetchSpecifications = async () => {
      try {
        const response = await fetch("/api/specifications")
        if (!response.ok) throw new Error("Failed to fetch specifications")
        const data = await response.json()
        setSpecifications(data)
      } catch (error) {
        console.error("Error fetching specifications:", error)
        setSpecifications([])
      }
    }

    // Fetch designs
    const fetchDesigns = async () => {
      try {
        const response = await fetch("/api/designs")
        if (!response.ok) throw new Error("Failed to fetch designs")
        const data = await response.json()
        setDesigns(data)
      } catch (error) {
        console.error("Error fetching designs:", error)
        setDesigns([])
      }
    }

    fetchSpecifications()
    fetchDesigns()
  }, [])

  const handleGenerateCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let result

      if (activeTab === "fromSpec") {
        if (!selectedSpecification) {
          setError("Please select a specification")
          setIsLoading(false)
          return
        }

        result = await generateFromSpecificationAndDesign(selectedSpecification, selectedDesign, language, framework)
      } else {
        if (!requirements.trim()) {
          setError("Please enter requirements")
          setIsLoading(false)
          return
        }

        result = await generateCode(language, framework, requirements)
      }

      if (result.success && result.code) {
        // Save the generated code
        const saveResult = await saveGeneratedCode(
          result.code,
          language,
          framework,
          activeTab === "manual" ? requirements : "",
          activeTab === "fromSpec" ? selectedSpecification : undefined,
          activeTab === "fromSpec" && selectedDesign ? selectedDesign : undefined,
        )

        if (saveResult.success) {
          // Navigate to the saved code view
          router.push(`/code-generation/${saveResult.data.id}`)
        } else {
          setError(`Error saving generated code: ${saveResult.error || "Unknown error"}`)
        }
      } else if (result.fallbackCode) {
        // Save the fallback code
        const saveResult = await saveGeneratedCode(
          result.fallbackCode,
          language,
          framework,
          activeTab === "manual" ? requirements : "",
          activeTab === "fromSpec" ? selectedSpecification : undefined,
          activeTab === "fromSpec" && selectedDesign ? selectedDesign : undefined,
        )

        if (saveResult.success) {
          router.push(`/code-generation/${saveResult.data.id}`)
        } else {
          setError(`Error saving generated code: ${saveResult.error || "Unknown error"}`)
        }
      } else {
        setError(`Error generating code: ${result.error || "Failed to generate code"}`)
      }
    } catch (error) {
      console.error("Error in code generation:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Generate Code</h2>
        <p className="text-gray-500">Generate code from specifications, designs, or custom requirements</p>
      </div>

      <Tabs defaultValue="fromSpec" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="fromSpec">From Specification & Design</TabsTrigger>
          <TabsTrigger value="manual">Enter Requirements Manually</TabsTrigger>
        </TabsList>

        <TabsContent value="fromSpec">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Specification</label>
                  <Select value={selectedSpecification} onValueChange={setSelectedSpecification}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a specification" />
                    </SelectTrigger>
                    <SelectContent>
                      {specifications.length > 0 ? (
                        specifications.map((spec) => (
                          <SelectItem key={spec.id} value={spec.id}>
                            {spec.app_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No specifications available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Design (Optional)</label>
                  <Select value={selectedDesign} onValueChange={setSelectedDesign}>
                    <SelectTrigger>
                      <SelectValue placeholder="No designs available" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {designs.length > 0 ? (
                        designs.map((design) => (
                          <SelectItem key={design.id} value={design.id}>
                            {design.name || design.type}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No designs available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Programming Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="TypeScript" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TypeScript">TypeScript</SelectItem>
                        <SelectItem value="JavaScript">JavaScript</SelectItem>
                        <SelectItem value="Python">Python</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Framework</label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger>
                        <SelectValue placeholder="Next.js" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Next.js">Next.js</SelectItem>
                        <SelectItem value="React">React</SelectItem>
                        <SelectItem value="Express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Requirements</label>
                  <Textarea
                    placeholder="Enter your requirements here..."
                    className="min-h-[200px]"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Programming Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="TypeScript" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TypeScript">TypeScript</SelectItem>
                        <SelectItem value="JavaScript">JavaScript</SelectItem>
                        <SelectItem value="Python">Python</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Framework</label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger>
                        <SelectValue placeholder="Next.js" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Next.js">Next.js</SelectItem>
                        <SelectItem value="React">React</SelectItem>
                        <SelectItem value="Express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

      <div className="mt-6 flex justify-end">
        <Button onClick={handleGenerateCode} disabled={isLoading} className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          {isLoading ? "Generating..." : "Generate Code"}
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Code Generation Tips</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Be Specific</h4>
                <p className="text-sm text-gray-500">
                  The more detailed your requirements, the better the generated code.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Review Generated Code</h4>
                <p className="text-sm text-gray-500">
                  Always review and understand the generated code before using it.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Iterative Approach</h4>
                <p className="text-sm text-gray-500">Generate code in small chunks and refine as needed.</p>
              </div>
              <div>
                <h4 className="font-medium">Customize</h4>
                <p className="text-sm text-gray-500">
                  Use generated code as a starting point and customize to your needs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Next Steps</h3>
            <p className="text-sm text-gray-500 mb-4">
              After generating code, you can move on to testing or setting up CI/CD pipelines.
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/testing")}>
                Test Automation
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/cicd")}>
                CI/CD Pipeline
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/code-generation/saved")}
              >
                View Saved Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
