"use server";

import { getSupabaseServer } from "./supabase-server";
import { revalidatePath } from "next/cache";
import { generateAIText } from "./ai-client";

// Validates a string is a proper UUID
function isValidUUID(id?: string): boolean {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// Generates code via the AI service
export async function generateCode(
  language: string,
  framework: string,
  requirements: string
) {
  const prompt = `Generate ${language} code using the ${framework} framework based on the following requirements:\n\n${requirements}`;
  const systemPrompt = `You are an expert in ${language} and ${framework}. Generate clean, secure, and well-commented code.`;

  const result = await generateAIText(prompt, systemPrompt, { temperature: 0.5, maxTokens: 2000 });
  if (result.success && result.text) {
    return { success: true, code: result.text };
  }

  // Fallback example
  return {
    success: false,
    error: result.error || "AI generation failed",
    fallbackCode:
      language === "typescript"
        ? `import React from 'react';\nconst Example = () => <div>Hello World</div>;\nexport default Example;`
        : `function main() { console.log("Hello World"); }\nmain();`,
  };
}

// Generates code based on stored specification and optional design
export async function generateFromSpecificationAndDesign(
  specificationId: string,
  designId: string,
  language: string,
  framework: string
) {
  const supabase = getSupabaseServer();

  const { data: spec, error: specError } = await supabase
    .from("specifications")
    .select("*")
    .eq("id", specificationId)
    .single();
  if (specError) {
    return { success: false, error: "Failed to fetch specification" };
  }

  let design = null;
  if (designId && designId !== "none") {
    const { data, error: designError } = await supabase
      .from("designs")
      .select("*")
      .eq("id", designId)
      .single();
    if (!designError) design = data;
  }

  // Build combined prompt
  let prompt = `Generate ${language} code using ${framework} based on specification:\nApp Name: ${spec.app_name}\nApp Type: ${spec.app_type}\nDescription: ${spec.app_description}\n`;
  if (spec.functional_requirements) prompt += `Functional Requirements:\n${spec.functional_requirements}\n`;
  if (spec.non_functional_requirements) prompt += `Non-Functional Requirements:\n${spec.non_functional_requirements}\n`;
  if (design) {
    prompt += `Design Type: ${design.type}\n`;
    if (design.diagram_code) prompt += `Diagram:\n${design.diagram_code}\n`;
    if (design.description) prompt += `Design Description:\n${design.description}\n`;
  }
  if (prompt.length > 4000) prompt = prompt.slice(0, 4000);

  const systemPrompt = `You are an expert in ${language} and ${framework}. Generate production-ready code.`;
  const result = await generateAIText(prompt, systemPrompt, { temperature: 0.5, maxTokens: 2000 });
  if (result.success && result.text) {
    return { success: true, code: result.text };
  }

  return {
    success: false,
    error: result.error || "AI generation failed",
    fallbackCode:
      language === "typescript"
        ? `import React from 'react';\nconst ExampleSpec = () => <div>Spec Example</div>;\nexport default ExampleSpec;`
        : `function main() { console.log("Spec Example"); }\nmain();`,
  };
}

// Persists generated code to Supabase
export async function saveGeneratedCode(
  code: string,
  language: string,
  framework: string,
  requirements: string,
  specificationId?: string,
  designId?: string
) {
  const supabase = getSupabaseServer();
  const validSpec = isValidUUID(specificationId) ? specificationId : null;
  const validDes = isValidUUID(designId) ? designId : null;

  const insert = {
    generated_code: code,
    language,
    framework,
    requirements,
    specification_id: validSpec,
    design_id: validDes,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("code_generations").insert([insert]).select();
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/code-generation");
  return { success: true, data: data?.[0] };
}

// Retrieves all generated code entries
export async function getGeneratedCode() {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("code_generations")
    .select("*, specifications(app_name), designs(type)")
    .order("created_at", { ascending: false });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// Retrieves a single code entry by ID
export async function getGeneratedCodeById(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid ID format" };
  }
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("code_generations")
    .select("*, specifications(app_name), designs(type)")
    .eq("id", id)
    .single();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// Deletes a code entry
export async function deleteGeneratedCode(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid ID format" };
  }
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("code_generations").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/code-generation");
  return { success: true };
}
