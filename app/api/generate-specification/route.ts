import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { prompt, systemPrompt, temperature, apiKey } = await request.json()

    // Validate API key
    if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key",
        },
        { status: 400 },
      )
    }

    // Validate prompt
    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is required",
        },
        { status: 400 },
      )
    }

    // Prepare the messages array
    const messages = [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      { role: "user", content: prompt },
    ]

    // Call OpenAI API directly using fetch
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages,
        temperature: temperature || 0.7,
        max_tokens: 4000,
      }),
    })

    // Handle API errors
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          error: `OpenAI API error: ${openaiResponse.status} ${errorData.error?.message || "Unknown error"}`,
        },
        { status: openaiResponse.status },
      )
    }

    // Parse the successful response
    const data = await openaiResponse.json()

    // Validate response structure
    if (!data?.choices?.[0]?.message?.content) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from OpenAI",
        },
        { status: 500 },
      )
    }

    // Return the generated text
    return NextResponse.json({
      success: true,
      text: data.choices[0].message.content,
    })
  } catch (error) {
    console.error("OpenAI generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
