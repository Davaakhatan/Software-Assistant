"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { generateAIText } from "@/lib/ai-service"

// Generate code from manual requirements
export async function generateCode(requirements: string, language: string, framework: string) {
  try {
    const prompt = `
      Generate ${language} code using the ${framework} framework based on the following requirements:
      
      ${requirements}
      
      Please provide clean, well-structured code with comments.
    `

    const systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the requirements provided.
Follow these guidelines:
1. Write clean, well-structured, and commented code
2. Follow best practices for ${language} and ${framework}
3. Implement proper error handling
4. Ensure the code is secure and follows modern development standards
5. Include necessary type definitions if using TypeScript`

    const result = await generateAIText(prompt, systemPrompt)

    if (result.success && result.text) {
      return { success: true, code: result.text }
    } else {
      return { success: false, error: result.error || "Failed to generate code" }
    }
  } catch (error) {
    console.error("Error generating code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code. Please try again.",
    }
  }
}

// Generate code from specification and design
export async function generateFromSpecificationAndDesign(
  specificationId: string,
  designId: string,
  language: string,
  framework: string,
) {
  try {
    const supabase = getSupabaseServer()

    // Fetch specification
    const { data: specification, error: specError } = await supabase
      .from("specifications")
      .select("*")
      .eq("id", specificationId)
      .single()

    if (specError) {
      console.error("Error fetching specification:", specError)
      return { success: false, error: "Failed to fetch specification" }
    }

    // Fetch design
    const { data: design, error: designError } = await supabase.from("designs").select("*").eq("id", designId).single()

    if (designError) {
      console.error("Error fetching design:", designError)
      return { success: false, error: "Failed to fetch design" }
    }

    // Build prompt based on specification and design
    let prompt = `Generate ${language} code using the ${framework} framework based on the following information:

`

    if (specification) {
      prompt += `## Specification
`
      prompt += `App Name: ${specification.app_name || "N/A"}
`
      prompt += `App Type: ${specification.app_type || "N/A"}
`
      prompt += `Description: ${specification.app_description || "N/A"}
`

      if (specification.functional_requirements) {
        prompt += `
Functional Requirements:
${specification.functional_requirements}
`
      }

      if (specification.non_functional_requirements) {
        prompt += `
Non-Functional Requirements:
${specification.non_functional_requirements}
`
      }
    }

    if (design) {
      prompt += `
## Design
`
      prompt += `Type: ${design.type || "N/A"}
`

      if (design.diagram_code) {
        prompt += `
Diagram:
${design.diagram_code}
`
      }

      if (design.description) {
        prompt += `
Description:
${design.description}
`
      }
    }

    prompt += `
Please generate complete, well-structured ${language} code using the ${framework} framework that implements these requirements.`

    // Generate code using AI
    const systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the provided specifications and designs. 
Include comments and explanations where appropriate.
Follow best practices for ${language} and ${framework}.`

    const result = await generateAIText(prompt, systemPrompt)

    if (result.success && result.text) {
      return { success: true, code: result.text }
    } else {
      return { success: false, error: result.error || "Failed to generate code" }
    }
  } catch (error) {
    console.error("Error generating code from specification and design:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code. Please try again.",
    }
  }
}

// Save generated code to storage
export async function saveGeneratedCode(code: string, fileName: string, language: string, framework: string) {
  try {
    const supabase = getSupabaseServer()

    // Get list of buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return { success: false, error: "Failed to access storage" }
    }

    // Use existing bucket or create a new one
    let bucketName = "code-files"

    if (buckets && buckets.length > 0) {
      // Use the first available bucket
      bucketName = buckets[0].name
    } else {
      // Create a new bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
        return { success: false, error: "Failed to create storage bucket" }
      }
    }

    // Create a folder path based on language
    const folderPath = language.toLowerCase()
    const filePath = `${folderPath}/${fileName}`

    // Upload the file
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, code, {
      contentType: "text/plain",
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { success: false, error: "Failed to save file" }
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    // Try to save metadata to the files table if it exists
    try {
      await supabase.from("files").insert({
        name: fileName,
        path: filePath,
        bucket: bucketName,
        url: publicUrl.publicUrl,
        type: "code",
        metadata: { language, framework },
      })
    } catch (dbError) {
      // Continue even if metadata saving fails
      console.warn("Could not save file metadata to database:", dbError)
    }

    return {
      success: true,
      message: "Code saved successfully",
      url: publicUrl.publicUrl,
      path: filePath,
      bucket: bucketName,
    }
  } catch (error) {
    console.error("Error saving generated code:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to save code. Please try again." }
  }
}
