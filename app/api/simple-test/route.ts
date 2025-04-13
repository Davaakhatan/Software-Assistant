import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get API key from query parameter
    const url = new URL(request.url)
    const apiKey = url.searchParams.get("key")

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API key is required",
        },
        { status: 400 },
      )
    }

    if (!apiKey.startsWith("sk-")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key format - must start with 'sk-'",
        },
        { status: 400 },
      )
    }

    // Call OpenAI API directly using fetch
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say 'API key is valid'" }],
        max_tokens: 20,
      }),
    })

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          error: `OpenAI API error: ${response.status} ${errorData.error?.message || "Unknown error"}`,
        },
        { status: response.status },
      )
    }

    // Parse the response
    const data = await response.json()

    // Validate response
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from OpenAI",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      response: data.choices[0].message.content,
    })
  } catch (error) {
    console.error("OpenAI test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
