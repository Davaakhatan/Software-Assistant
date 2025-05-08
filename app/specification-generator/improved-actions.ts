"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Type definitions for our improved schema
type SpecificationFormData = {
  appName: string
  appDescription: string
  appType: string
  targetAudience?: string
  keyFeatures?: string
  technicalConstraints?: string
  includeItems: Record<string, boolean>
  projectId?: string
  version?: string
  status?: string
  complexity?: string
  tags?: string[]
}

type SpecificationSection = {
  id: string
  name: string
  content: string
}

/**
 * Save a specification using the new normalized schema
 */
export async function saveSpecificationImproved(formData: SpecificationFormData) {
  try {
    const supabase = getSupabaseServer()

    // 1. Get the type_id from specification_types
    const { data: typeData, error: typeError } = await supabase
      .from("specification_types")
      .select("id")
      .eq("name", formData.appType)
      .single()

    if (typeError) {
      console.error("Error fetching specification type:", typeError)
      // If type doesn't exist, use the 'other' type
      const { data: otherType } = await supabase.from("specification_types").select("id").eq("name", "other").single()

      let typeData

      if (otherType) {
        typeData = otherType
      } else {
        return { success: false, error: "Could not find a valid specification type" }
      }
    }

    // 2. Insert the specification
    const { data: specData, error: specError } = await supabase
      .from("specifications_new")
      .insert({
        app_name: formData.appName,
        app_description: formData.appDescription,
        type_id: typeData.id,
        complexity: formData.complexity || "medium",
        project_id: formData.projectId || null,
        version: formData.version || "1.0",
        status: formData.status || "draft",
      })
      .select()

    if (specError) {
      console.error("Error creating specification:", specError)
      return { success: false, error: specError.message }
    }

    const specificationId = specData[0].id

    // 3. Get all section IDs
    const { data: sections, error: sectionsError } = await supabase
      .from("specification_sections")
      .select("id, name")
      .order("display_order", { ascending: true })

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError)
      return { success: false, error: sectionsError.message }
    }

    // 4. Insert content for each section that's included
    const contentInserts = []

    for (const section of sections) {
      // Only include sections that were checked in the form
      if (section.name === "target_audience" && formData.targetAudience) {
        contentInserts.push({
          specification_id: specificationId,
          section_id: section.id,
          content: formData.targetAudience,
        })
      } else if (section.name === "key_features" && formData.keyFeatures) {
        contentInserts.push({
          specification_id: specificationId,
          section_id: section.id,
          content: formData.keyFeatures,
        })
      } else if (section.name === "technical_constraints" && formData.technicalConstraints) {
        contentInserts.push({
          specification_id: specificationId,
          section_id: section.id,
          content: formData.technicalConstraints,
        })
      } else if (formData.includeItems[section.name] === true) {
        // For sections that are just included but don't have content yet
        contentInserts.push({
          specification_id: specificationId,
          section_id: section.id,
          content: "", // Empty content initially
        })
      }
    }

    if (contentInserts.length > 0) {
      const { error: contentError } = await supabase.from("specification_content").insert(contentInserts)

      if (contentError) {
        console.error("Error inserting section content:", contentError)
        return { success: false, error: contentError.message }
      }
    }

    // 5. Handle tags if provided
    if (formData.tags && formData.tags.length > 0) {
      for (const tagName of formData.tags) {
        // First, ensure the tag exists
        const { data: existingTag, error: tagError } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .maybeSingle()

        let tagId

        if (tagError || !existingTag) {
          // Create the tag if it doesn't exist
          const { data: newTag, error: createTagError } = await supabase.from("tags").insert({ name: tagName }).select()

          if (createTagError) {
            console.error("Error creating tag:", createTagError)
            continue
          }

          tagId = newTag[0].id
        } else {
          tagId = existingTag.id
        }

        // Link the tag to the specification
        await supabase.from("specification_tags").insert({
          specification_id: specificationId,
          tag_id: tagId,
        })
      }
    }

    revalidatePath("/specification-generator")
    revalidatePath("/specifications-list")

    return { success: true, data: { id: specificationId } }
  } catch (error) {
    console.error("Error saving specification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save specification",
    }
  }
}

/**
 * Get a specification with all its sections using the new schema
 */
export async function getSpecificationByIdImproved(id: string) {
  try {
    const supabase = getSupabaseServer()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid specification ID format",
      }
    }

    // Get the specification
    const { data: specification, error: specError } = await supabase
      .from("specifications_new")
      .select(`
        *,
        specification_types(name, description),
        projects(name, description)
      `)
      .eq("id", id)
      .single()

    if (specError) {
      throw specError
    }

    // Get all sections with content
    const { data: sectionContent, error: contentError } = await supabase
      .from("specification_content")
      .select(`
        content,
        specification_sections(id, name, description, display_order)
      `)
      .eq("specification_id", id)
      .order("specification_sections(display_order)", { ascending: true })

    if (contentError) {
      throw contentError
    }

    // Get tags
    const { data: tags, error: tagsError } = await supabase
      .from("specification_tags")
      .select("tags(id, name)")
      .eq("specification_id", id)

    if (tagsError) {
      throw tagsError
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from("specification_comments")
      .select(`
        id,
        comment,
        created_at,
        users(name),
        specification_sections(name)
      `)
      .eq("specification_id", id)
      .order("created_at", { ascending: false })

    if (commentsError) {
      throw commentsError
    }

    // Format the data for the frontend
    const formattedSections = {}
    sectionContent.forEach((item) => {
      const section = item.specification_sections
      formattedSections[section.name] = {
        id: section.id,
        name: section.name,
        description: section.description,
        content: item.content,
        displayOrder: section.display_order,
      }
    })

    const formattedTags = tags.map((tag) => tag.tags.name)

    return {
      success: true,
      data: {
        ...specification,
        sections: formattedSections,
        tags: formattedTags,
        comments: comments,
      },
    }
  } catch (error) {
    console.error("Error fetching specification by id:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch specification",
    }
  }
}

/**
 * Get all specifications with the new schema
 */
export async function getSpecificationsImproved() {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from("specifications_new")
      .select(`
        *,
        specification_types(name),
        projects(name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // For each specification, get its tags
    const specificationsWithTags = await Promise.all(
      data.map(async (spec) => {
        const { data: tags, error: tagsError } = await supabase
          .from("specification_tags")
          .select("tags(name)")
          .eq("specification_id", spec.id)

        if (tagsError) {
          console.error("Error fetching tags:", tagsError)
          return { ...spec, tags: [] }
        }

        return {
          ...spec,
          tags: tags.map((tag) => tag.tags.name),
        }
      }),
    )

    return {
      success: true,
      data: specificationsWithTags,
    }
  } catch (error) {
    console.error("Error fetching specifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch specifications",
    }
  }
}

/**
 * Delete a specification with the new schema
 */
export async function deleteSpecificationImproved(id: string) {
  try {
    const supabase = getSupabaseServer()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid specification ID format",
      }
    }

    // Delete the specification (cascade will handle related records)
    const { error } = await supabase.from("specifications_new").delete().eq("id", id)

    if (error) {
      throw error
    }

    revalidatePath("/specifications-list")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting specification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete specification",
    }
  }
}

/**
 * Add a comment to a specification
 */
export async function addSpecificationComment(specId: string, sectionId: string, comment: string, userId?: string) {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from("specification_comments")
      .insert({
        specification_id: specId,
        section_id: sectionId,
        user_id: userId,
        comment,
      })
      .select()

    if (error) {
      throw error
    }

    revalidatePath(`/specifications/${specId}`)

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add comment",
    }
  }
}

/**
 * Update a specification section's content
 */
export async function updateSpecificationSection(specId: string, sectionId: string, content: string, userId?: string) {
  try {
    const supabase = getSupabaseServer()

    // First, get the current content for history
    const { data: currentData, error: fetchError } = await supabase
      .from("specification_content")
      .select("content")
      .eq("specification_id", specId)
      .eq("section_id", sectionId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // Not found is ok
      throw fetchError
    }

    const previousContent = currentData?.content || ""

    // Update the content
    const { error: updateError } = await supabase.from("specification_content").upsert({
      specification_id: specId,
      section_id: sectionId,
      content,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      throw updateError
    }

    // Record the change in history
    if (previousContent !== content) {
      await supabase.from("specification_history").insert({
        specification_id: specId,
        section_id: sectionId,
        user_id: userId,
        previous_content: previousContent,
        new_content: content,
      })
    }

    revalidatePath(`/specifications/${specId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error updating section:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update section",
    }
  }
}

/**
 * Get all projects for dropdown selection
 */
export async function getProjectsList() {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase.from("projects").select("id, name").order("name", { ascending: true })

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching projects:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch projects",
    }
  }
}

/**
 * Get all specification types for dropdown selection
 */
export async function getSpecificationTypes() {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from("specification_types")
      .select("id, name, description")
      .order("name", { ascending: true })

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching specification types:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch specification types",
    }
  }
}
