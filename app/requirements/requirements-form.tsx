"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, Trash, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveRequirements } from "./actions"
import { getSpecifications } from "../specification-generator/actions"

export default function RequirementsForm() {
  const { toast } = useToast()
  const [projectName, setProjectName] = useState("")
  const [project_description, setProjectDescription] = useState("")
  const [userStories, setUserStories] = useState([{ role: "", action: "", benefit: "", priority: "medium" }])
  const [functionalRequirements, setFunctionalRequirements] = useState([{ description: "", priority: "medium" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [specifications, setSpecifications] = useState([])
  const [selectedSpecId, setSelectedSpecId] = useState("")
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(true)

  useEffect(() => {
    const fetchSpecifications = async () => {
      try {
        const result = await getSpecifications()
        if (result.success) {
          setSpecifications(result.data || [])
        } else {
          console.error("Failed to load specifications:", result.error)
          // Set empty array if there's an error
          setSpecifications([])
        }
      } catch (error) {
        console.error("Error fetching specifications:", error)
        // Set empty array if there's an error
        setSpecifications([])
      } finally {
        setIsLoadingSpecs(false)
      }
    }

    fetchSpecifications()
  }, [])

  const addUserStory = () => {
    setUserStories([...userStories, { role: "", action: "", benefit: "", priority: "medium" }])
  }

  const updateUserStory = (index, field, value) => {
    const updatedStories = [...userStories]
    updatedStories[index][field] = value
    setUserStories(updatedStories)
  }

  const removeUserStory = (index) => {
    const updatedStories = [...userStories]
    updatedStories.splice(index, 1)
    setUserStories(updatedStories)
  }

  const addFunctionalRequirement = () => {
    setFunctionalRequirements([...functionalRequirements, { description: "", priority: "medium" }])
  }

  const updateFunctionalRequirement = (index, field, value) => {
    const updatedRequirements = [...functionalRequirements]
    updatedRequirements[index][field] = value
    setFunctionalRequirements(updatedRequirements)
  }

  const removeFunctionalRequirement = (index) => {
    const updatedRequirements = [...functionalRequirements]
    updatedRequirements.splice(index, 1)
    setFunctionalRequirements(updatedRequirements)
  }

  const generateFromSpecification = async () => {
    if (!selectedSpecId) {
      toast({
        title: "No specification selected",
        description: "Please select a specification to generate requirements from.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Find the selected specification
      const selectedSpec = specifications.find((spec) => spec.id === selectedSpecId)

      if (!selectedSpec) {
        throw new Error("Selected specification not found")
      }

      // Set project name and description from the specification
      setProjectName(selectedSpec.app_name)
      setProjectDescription(selectedSpec.app_description)

      // Parse functional requirements from the specification
      if (selectedSpec.functional_requirements) {
        const lines = selectedSpec.functional_requirements.split("\n")
        const newFunctionalRequirements = []

        // Simple parsing logic - look for numbered items
        for (const line of lines) {
          const trimmedLine = line.trim()
          // Match lines that start with a number followed by a period or parenthesis
          if (/^\d+[.)]/.test(trimmedLine) && trimmedLine.length > 5) {
            // Remove the number and leading characters
            const description = trimmedLine.replace(/^\d+[.)]\s*/, "")

            // Determine priority based on keywords
            let priority = "medium"
            if (/must|critical|essential/i.test(description)) {
              priority = "high"
            } else if (/nice to have|optional|if possible/i.test(description)) {
              priority = "low"
            }

            newFunctionalRequirements.push({ description, priority })
          }
        }

        // If we found requirements, use them
        if (newFunctionalRequirements.length > 0) {
          setFunctionalRequirements(newFunctionalRequirements)
        }
      }

      // Generate user stories based on functional requirements
      const newUserStories = []

      // Convert functional requirements to user stories
      functionalRequirements.forEach((req) => {
        if (req.description) {
          // Determine user role based on the requirement
          let role = "User"
          if (/admin|administrator/i.test(req.description)) {
            role = "Administrator"
          } else if (/customer|client/i.test(req.description)) {
            role = "Customer"
          }

          // Extract the action from the requirement
          const action = req.description.replace(/system shall|the system will|application must/i, "").trim()

          // Generate a benefit
          const benefit = "I can accomplish my tasks efficiently"

          newUserStories.push({
            role,
            action,
            benefit,
            priority: req.priority,
          })
        }
      })

      if (newUserStories.length > 0) {
        setUserStories(newUserStories)
      }

      toast({
        title: "Requirements generated",
        description: "Requirements have been generated from the selected specification.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate requirements from specification",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate user stories
      const validUserStories = userStories.filter(
        (story) => story.role.trim() && story.action.trim() && story.benefit.trim(),
      )

      // Validate functional requirements
      const validFunctionalRequirements = functionalRequirements.filter((req) => req.description.trim())

      const formData = {
        projectName,
        project_description,
        userStories: validUserStories,
        functionalRequirements: validFunctionalRequirements,
        specificationId: selectedSpecId || null, // Link to specification if selected
      }

      const result = await saveRequirements(formData)

      if (result.success) {
        toast({
          title: "Requirements saved",
          description: "Your project requirements have been saved successfully.",
        })

        // Reset form
        setProjectName("")
        setProjectDescription("")
        setUserStories([{ role: "", action: "", benefit: "", priority: "medium" }])
        setFunctionalRequirements([{ description: "", priority: "medium" }])
        setSelectedSpecId("")
      } else {
        throw new Error(result.error || "Failed to save requirements")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save requirements",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Basic details about your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specification">Generate from Specification (Optional)</Label>
            <div className="flex gap-2">
              <Select
                value={selectedSpecId}
                onValueChange={setSelectedSpecId}
                disabled={isLoadingSpecs}
                className="flex-1"
              >
                <SelectTrigger id="specification">
                  <SelectValue placeholder="Select a specification" />
                </SelectTrigger>
                <SelectContent>
                  {specifications.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id}>
                      {spec.app_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={generateFromSpecification}
                disabled={isGenerating || !selectedSpecId}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
            {isLoadingSpecs && <p className="text-sm text-muted-foreground">Loading specifications...</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Project Description</Label>
            <Textarea
              id="project-description"
              placeholder="Describe your project"
              rows={4}
              value={project_description}
              onChange={(e) => setProjectDescription(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Stories</CardTitle>
            <CardDescription>Define what users need from your application</CardDescription>
          </div>
          <Button type="button" onClick={addUserStory} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Story
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {userStories.map((story, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-md relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => removeUserStory(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`user-role-${index}`}>As a (Role)</Label>
                  <Input
                    id={`user-role-${index}`}
                    placeholder="e.g., Administrator"
                    value={story.role}
                    onChange={(e) => updateUserStory(index, "role", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`user-priority-${index}`}>Priority</Label>
                  <Select value={story.priority} onValueChange={(value) => updateUserStory(index, "priority", value)}>
                    <SelectTrigger id={`user-priority-${index}`}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (Must Have)</SelectItem>
                      <SelectItem value="medium">Medium (Should Have)</SelectItem>
                      <SelectItem value="low">Low (Nice to Have)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`user-action-${index}`}>I want to (Action)</Label>
                <Input
                  id={`user-action-${index}`}
                  placeholder="e.g., create and manage user accounts"
                  value={story.action}
                  onChange={(e) => updateUserStory(index, "action", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`user-benefit-${index}`}>So that (Benefit)</Label>
                <Input
                  id={`user-benefit-${index}`}
                  placeholder="e.g., I can control access to the system"
                  value={story.benefit}
                  onChange={(e) => updateUserStory(index, "benefit", e.target.value)}
                  required
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Functional Requirements</CardTitle>
            <CardDescription>Specific features and capabilities needed</CardDescription>
          </div>
          <Button type="button" onClick={addFunctionalRequirement} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {functionalRequirements.map((req, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-md relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => removeFunctionalRequirement(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <Label htmlFor={`req-description-${index}`}>Requirement Description</Label>
                <Textarea
                  id={`req-description-${index}`}
                  placeholder="Describe the requirement in detail"
                  rows={3}
                  value={req.description}
                  onChange={(e) => updateFunctionalRequirement(index, "description", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`req-priority-${index}`}>Priority</Label>
                <Select
                  value={req.priority}
                  onValueChange={(value) => updateFunctionalRequirement(index, "priority", value)}
                >
                  <SelectTrigger id={`req-priority-${index}`}>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (Must Have)</SelectItem>
                    <SelectItem value="medium">Medium (Should Have)</SelectItem>
                    <SelectItem value="low">Low (Nice to Have)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Requirements"}
        </Button>
      </div>
    </form>
  )
}
