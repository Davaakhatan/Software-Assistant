"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateRequirements } from "../../actions"
import { useRouter } from "next/navigation"

export default function EditRequirementForm({ requirementData, id }) {
  const { requirement, userStories, functionalRequirements } = requirementData
  const { toast } = useToast()
  const router = useRouter()

  const [projectName, setProjectName] = useState(requirement.project_name)
  const [projectDescription, setProjectDescription] = useState(requirement.project_description)
  const [userStoriesState, setUserStories] = useState(
    userStories.length > 0
      ? userStories.map((story) => ({
          role: story.role,
          action: story.action,
          benefit: story.benefit,
          priority: story.priority,
        }))
      : [{ role: "", action: "", benefit: "", priority: "medium" }],
  )

  const [functionalRequirementsState, setFunctionalRequirements] = useState(
    functionalRequirements.length > 0
      ? functionalRequirements.map((req) => ({
          description: req.description,
          priority: req.priority,
        }))
      : [{ description: "", priority: "medium" }],
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  const addUserStory = () => {
    setUserStories([...userStoriesState, { role: "", action: "", benefit: "", priority: "medium" }])
  }

  const updateUserStory = (index, field, value) => {
    const updatedStories = [...userStoriesState]
    updatedStories[index][field] = value
    setUserStories(updatedStories)
  }

  const removeUserStory = (index) => {
    const updatedStories = [...userStoriesState]
    updatedStories.splice(index, 1)
    setUserStories(updatedStories)
  }

  const addFunctionalRequirement = () => {
    setFunctionalRequirements([...functionalRequirementsState, { description: "", priority: "medium" }])
  }

  const updateFunctionalRequirement = (index, field, value) => {
    const updatedRequirements = [...functionalRequirementsState]
    updatedRequirements[index][field] = value
    setFunctionalRequirements(updatedRequirements)
  }

  const removeFunctionalRequirement = (index) => {
    const updatedRequirements = [...functionalRequirementsState]
    updatedRequirements.splice(index, 1)
    setFunctionalRequirements(updatedRequirements)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate user stories
      const validUserStories = userStoriesState.filter(
        (story) => story.role.trim() && story.action.trim() && story.benefit.trim(),
      )

      // Validate functional requirements
      const validFunctionalRequirements = functionalRequirementsState.filter((req) => req.description.trim())

      const formData = {
        projectName,
        projectDescription,
        userStories: validUserStories,
        functionalRequirements: validFunctionalRequirements,
      }

      const result = await updateRequirements(id, formData)

      if (result.success) {
        toast({
          title: "Requirements updated",
          description: "Your project requirements have been updated successfully.",
        })

        router.push(`/requirements/${id}`)
      } else {
        throw new Error(result.error || "Failed to update requirements")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update requirements",
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
              value={projectDescription}
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
          {userStoriesState.map((story, index) => (
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
          {functionalRequirementsState.map((req, index) => (
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
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
