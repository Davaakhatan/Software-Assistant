import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const { messages, apiKey } = await req.json()

    if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-")) {
      return NextResponse.json({ error: "OpenAI API key is missing or invalid" }, { status: 400 })
    }

    // Initialize the OpenAI client with the provided API key
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    })

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a less expensive model for chat
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for software development questions.",
        },
        ...messages,
      ],
      max_tokens: 500,
    })

    // Extract the response text
    const responseText = completion.choices[0]?.message?.content || "No response generated."

    return NextResponse.json({ success: true, text: responseText })
  } catch (error: any) {
    console.error("Error in chat API:", error)

    return NextResponse.json(
      {
        error: error.message || "An error occurred while processing your request",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
