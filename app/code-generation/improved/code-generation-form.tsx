"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { generateFromImprovedSpecification, saveGeneratedCodeImproved } from "../improved-actions.server"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// Define form schema
const formSchema = z.object({
  specificationId: z.string().optional(),
  designId: z.string().optional(),
  language: z.string().min(1, { message: "Please select a language" }),
  framework: z.string().min(1, { message: "Please select a framework" }),
  requirements: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Define props
interface CodeGenerationFormProps {
  specifications: any[]
  initialSpecId?: string
  initialDesignId?: string
}

export default function CodeGenerationForm({
  specifications,
  initialSpecId,
  initialDesignId,
}: CodeGenerationFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [designs, setDesigns] = useState([])
  const [error, setError] = useState("")
  const router = useRouter()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specificationId: initialSpecId || "",
      designId: initialDesignId || "",
      language: "typescript",
      framework: "react",
      requirements: "",
    },
  })

  // Watch for specification changes to load related designs
  const selectedSpecId = form.watch("specificationId")

  // Fetch designs when specification changes
  useEffect(() => {
    async function fetchDesigns() {
      if (!selectedSpecId) {
        setDesigns([])
        return
      }

      try {
        const response = await fetch(`/api/designs?specificationId=${selectedSpecId}`)
        const data = await response.json()
        setDesigns(data || [])
      } catch (error) {
        console.error("Error fetching designs:", error)
        setDesigns([])
      }
    }

    fetchDesigns()
  }, [selectedSpecId])

  // Handle form submission
  async function onSubmit(values: FormValues) {
    setIsGenerating(true)
    setError("")

    try {
      // Generate code based on specification and design
      if (values.specificationId) {
        const result = await generateFromImprovedSpecification(
          values.specificationId,
          values.designId || "none",
          values.language,
          values.framework,
        )

        if (result.success && result.code) {
          setGeneratedCode(result.code)
        } else if (result.fallbackCode) {
          setGeneratedCode(result.fallbackCode)
          setError(result.error || "Failed to generate code. Using fallback code instead.")
        } else {
          setError(result.error || "Failed to generate code")
        }
      } else if (values.requirements) {
        // Use the original generate code function for direct requirements
        const result = await fetch("/api/generate-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: values.language,
            framework: values.framework,
            requirements: values.requirements,
          }),
        }).then((res) => res.json())

        if (result.success && result.code) {
          setGeneratedCode(result.code)
        } else if (result.fallbackCode) {
          setGeneratedCode(result.fallbackCode)
          setError(result.error || "Failed to generate code. Using fallback code instead.")
        } else {
          setError(result.error || "Failed to generate code")
        }
      } else {
        setError("Please provide either a specification or requirements")
      }
    } catch (error) {
      console.error("Error generating code:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle saving generated code
  async function handleSave() {
    if (!generatedCode) return

    try {
      const values = form.getValues()
      const result = await saveGeneratedCodeImproved(
        generatedCode,
        values.language,
        values.framework,
        values.requirements || "",
        values.specificationId,
        values.designId,
      )

      if (result.success && result.data) {
        router.push(`/code-generation/${result.data.id}`)
      } else {
        setError(result.error || "Failed to save generated code")
      }
    } catch (error) {
      console.error("Error saving generated code:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="specificationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specification</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a specification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {specifications.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {spec.app_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select a specification to generate code from</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="designId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Design</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a design" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {designs.map((design) => (
                        <SelectItem key={design.id} value={design.id}>
                          {design.type} - {new Date(design.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Optionally select a design to include</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the programming language</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="framework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Framework</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a framework" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="nextjs">Next.js</SelectItem>
                      <SelectItem value="vue">Vue.js</SelectItem>
                      <SelectItem value="angular">Angular</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="django">Django</SelectItem>
                      <SelectItem value="flask">Flask</SelectItem>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="dotnet">ASP.NET Core</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the framework or library</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Requirements (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional requirements or instructions for code generation"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide any additional requirements or instructions for the code generation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Code"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

      {generatedCode && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Code</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto rounded-md border">
              <SyntaxHighlighter
                language={form.getValues().language}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{ margin: 0 }}
              >
                {generatedCode}
              </SyntaxHighlighter>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
