// app/api/generate-specification/route.ts

import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt, temperature, apiKey } = await request.json();

    // Choose the API key: request-provided or env
    const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!effectiveApiKey?.startsWith("sk-")) {
      return NextResponse.json(
        { success: false, error: "OpenAI API key is missing or invalid" },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const messages = [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      { role: "user", content: prompt },
    ];

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo-16k",
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: 4000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const err = await openaiResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: `OpenAI API error: ${openaiResponse.status} ${
            err.error?.message || "Unknown error"
          }`,
        },
        { status: openaiResponse.status }
      );
    }

    const data = await openaiResponse.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Invalid response from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, text: content });
  } catch (e: any) {
    console.error("Error in generate-specification route:", e);
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
