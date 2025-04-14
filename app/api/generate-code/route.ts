"use client"

import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { generateAIText } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { activeTab, specificationId, designId, requirements, language, framework } = await request.json()

    console.log("Generate code request received:", { activeTab, specificationId, designId, language, framework })

    let code = ""
    let prompt = ""
    let systemPrompt = ""

    // Set a shorter timeout for complex requests
    const isComplexRequest = activeTab === "fromSpecDesign" && specificationId
    const timeoutDuration = isComplexRequest ? 25000 : 20000 // 25 or 20 seconds

    // Create a controller for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

    // Generate code based on the active tab
    if (activeTab === "fromSpecDesign") {
      const supabase = getSupabaseServer()

      // Fetch specification
      const { data: specification, error: specError } = await supabase
        .from("specifications")
        .select("*")
        .eq("id", specificationId)
        .single()

      if (specError) {
        console.error("Error fetching specification:", specError)
        return NextResponse.json({ error: "Failed to fetch specification" }, { status: 400 })
      }

      // Fetch design
      let design = null
      let designError = null

      if (designId) {
        const designResult = await supabase.from("designs").select("*").eq("id", designId).single()

        design = designResult.data
        designError = designResult.error

        if (designError) {
          console.error("Error fetching design:", designError)
          // Continue without design data instead of failing
        }
      }

      // Build prompt based on specification and design
      prompt = `Generate ${language} code using the ${framework} framework based on the following information:

Specification:
App Name: ${specification.app_name || "N/A"}
App Type: ${specification.app_type || "N/A"}
Description: ${specification.app_description || "N/A"}
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

      if (design) {
        prompt += `
Design:
Type: ${design.type || "N/A"}
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

      // Simplify the prompt if it's too long
      if (prompt.length > 4000) {
        console.log("Prompt is too long, simplifying...")
        prompt = `Generate ${language} code using the ${framework} framework for an application with the following details:
- Name: ${specification.app_name || "N/A"}
- Type: ${specification.app_type || "N/A"}
- Key requirements: ${specification.functional_requirements ? specification.functional_requirements.substring(0, 500) + "..." : "N/A"}
- Please focus on creating a minimal viable implementation.`
      }

      prompt += `
Please generate complete, well-structured ${language} code using the ${framework} framework that implements these requirements.`

      // Generate code using AI
      systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the provided specifications and designs. 
Include comments and explanations where appropriate.
Follow best practices for ${language} and ${framework}.
Keep your response concise and focused on the most important functionality.`
    } else {
      // Generate from manual requirements
      prompt = `
Generate ${language} code using the ${framework} framework based on the following requirements:

${requirements}

Please provide clean, well-structured code with comments.`

      systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the requirements provided.
Follow these guidelines:
1. Write clean, well-structured, and commented code
2. Follow best practices for ${language} and ${framework}
3. Implement proper error handling
4. Ensure the code is secure and follows modern development standards
5. Include necessary type definitions if using TypeScript
6. Keep your response concise and focused on the most important functionality.`
    }

    // Generate code using AI
    try {
      console.log("Generating code with AI...")
      const result = await generateAIText(prompt, systemPrompt, {
        temperature: 0.5, // Lower temperature for more predictable results
        maxTokens: 2000, // Limit token count to avoid timeouts
      })

      clearTimeout(timeoutId)

      if (!result.success || !result.text) {
        console.error("AI generation failed:", result.error)

        // Provide a fallback response
        const fallbackCode = generateFallbackCode(
          language,
          framework,
          activeTab === "fromSpecDesign" ? "specification" : "requirements",
        )

        return NextResponse.json({
          code: fallbackCode,
          error: result.error || "Failed to generate code with AI, providing fallback code",
          fallback: true,
        })
      }

      code = result.text
      console.log("Code generated successfully")

      // Save the generated code to the code_generations table if possible
      try {
        const supabase = getSupabaseServer()
        await supabase.from("code_generations").insert({
          code: code,
          language: language,
          framework: framework,
          created_at: new Date().toISOString(),
          // Don't include project_id to avoid foreign key constraint issues
        })
      } catch (dbError) {
        console.warn("Could not save generated code to database:", dbError)
        // Continue even if saving to DB fails
      }

      return NextResponse.json({ code })
    } catch (aiError) {
      console.error("Error generating code with AI:", aiError)
      clearTimeout(timeoutId)

      // Provide a fallback response with an error message
      const fallbackCode = generateFallbackCode(
        language,
        framework,
        activeTab === "fromSpecDesign" ? "specification" : "requirements",
      )

      return NextResponse.json({
        code: fallbackCode,
        error: aiError instanceof Error ? aiError.message : "Unknown error",
        fallback: true,
      })
    }
  } catch (error) {
    console.error("Error in generate-code API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        code: generateFallbackCode("typescript", "nextjs", "error"),
        fallback: true,
      },
      { status: 500 },
    )
  }
}

// Helper function to generate fallback code when AI fails
function generateFallbackCode(language: string, framework: string, source: string): string {
  if (language === "typescript" || language === "javascript") {
    if (framework === "nextjs" || framework === "react") {
      return `// Fallback code generated due to AI timeout
// This is a simple ${framework} component in ${language}

${language === "typescript" ? "import React from 'react';\n\ninterface Props {\n  title?: string;\n}\n" : "import React from 'react';\n"}

export default function ExampleComponent(${language === "typescript" ? "props: Props" : "props"}) {
  const { title = "Hello World" } = props;
  const [count, setCount] = React.useState(0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="mb-4">
        This is a fallback component generated because the AI code generation timed out.
        The original request was based on ${source}.
      </p>
      <p className="mb-4">Count: {count}</p>
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
    </div>
  );
}`
    } else {
      return `// Fallback code generated due to AI timeout
// This is a simple ${framework} example in ${language}

${language === "typescript" ? "interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n" : ""}

function getUsers() {
  console.log("Fetching users...");
  // This would normally fetch from a database or API
  return Promise.resolve([
    { id: 1, name: "User One", email: "user1@example.com" },
    { id: 2, name: "User Two", email: "user2@example.com" },
  ]);
}

// Example usage
async function main() {
  try {
    const users = await getUsers();
    console.log("Users:", users);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// This is a fallback example because the AI code generation timed out.
// The original request was based on ${source}.
main();`
    }
  } else if (language === "python") {
    return `# Fallback code generated due to AI timeout
# This is a simple ${framework} example in Python

def get_users():
    """
    Get a list of users
    
    This is a fallback example because the AI code generation timed out.
    The original request was based on ${source}.
    """
    print("Fetching users...")
    # This would normally fetch from a database or API
    return [
        {"id": 1, "name": "User One", "email": "user1@example.com"},
        {"id": 2, "name": "User Two", "email": "user2@example.com"},
    ]

# Example usage
def main():
    try:
        users = get_users()
        print("Users:", users)
    except Exception as e:
        print(f"Error fetching users: {e}")

if __name__ == "__main__":
    main()`
  } else {
    return `// Fallback code generated due to AI timeout
// This is a simple ${framework} example in ${language}

// This is a fallback example because the AI code generation timed out.
// The original request was based on ${source}.

public class Example {
    public static void main(String[] args) {
        System.out.println("Hello World!");
        System.out.println("This is a fallback example because the AI code generation timed out.");
    }
}`
  }
}
