import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("Starting OpenAI test endpoint")

  try {
    // Get the API key from the query parameter
    const url = new URL(request.url)
    const apiKey = url.searchParams.get("key")

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API key is missing",
        },
        { status: 400 },
      )
    }

    // Test the API key by making a direct fetch request to OpenAI API
    // This avoids any issues with the OpenAI client library
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 10,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Extract the content safely
      const content = data.choices?.[0]?.message?.content || "Hello from OpenAI!"

      return NextResponse.json({
        success: true,
        message: "OpenAI connection successful",
        response: content,
      })
    } else {
      // API returned an error
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || "Invalid API key or API error",
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("OpenAI test error:", error)

    // Get error message safely
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    } else if (error && typeof error === "object") {
      try {
        errorMessage = JSON.stringify(error)
      } catch {
        errorMessage = "Error object could not be converted to string"
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
