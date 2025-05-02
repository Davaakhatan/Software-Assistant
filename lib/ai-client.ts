"use client";

// Client-side AI text generator with relative/absolute URL fallback
export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<{ success: boolean; text?: string; error?: string }> {
  if (typeof window === "undefined") {
    throw new Error("generateAIText must run in the browser");
  }

  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey || !apiKey.startsWith("sk-")) {
    return { success: false, error: "OpenAI API key missing or invalid" };
  }

  const payload = {
    prompt,
    systemPrompt,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens ?? 2000,
    apiKey,
  };
  let url = "/api/generate-specification";
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // If relative fails, fall back to absolute
    const origin = window.location.origin;
    url = new URL(url, origin).toString();
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData.error || `HTTP ${response.status}`;
    return { success: false, error: message };
  }

  const data = await response.json();
  if (!data.success) {
    return { success: false, error: data.error };
  }

  return { success: true, text: data.text };
}

// Checks if an OpenAI API key is present in localStorage
export function isApiKeyAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const apiKey = localStorage.getItem("openai_api_key");
  return !!apiKey && apiKey.startsWith("sk-");
}
