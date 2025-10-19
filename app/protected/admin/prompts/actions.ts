"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createPrompt(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const organizationId = formData.get("organizationId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const promptType = formData.get("prompt_type") as string;
  const systemPrompt = formData.get("system_prompt") as string;
  const userPromptTemplate = formData.get("user_prompt_template") as string;
  const model = formData.get("model") as string;
  const temperature = parseFloat(formData.get("temperature") as string);
  const maxTokens = parseInt(formData.get("max_tokens") as string);
  const isDefault = formData.get("is_default") === "on";
  const isActive = formData.get("is_active") === "on";

  const { error } = await supabase.from("ai_prompts").insert({
    organization_id: organizationId,
    name,
    description: description || null,
    prompt_type: promptType,
    system_prompt: systemPrompt || null,
    user_prompt_template: userPromptTemplate,
    model,
    temperature,
    max_tokens: maxTokens,
    is_default: isDefault,
    is_active: isActive,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/admin/prompts");
  redirect("/protected/admin/prompts");
}

export async function updatePrompt(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const promptId = formData.get("promptId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const promptType = formData.get("prompt_type") as string;
  const systemPrompt = formData.get("system_prompt") as string;
  const userPromptTemplate = formData.get("user_prompt_template") as string;
  const model = formData.get("model") as string;
  const temperature = parseFloat(formData.get("temperature") as string);
  const maxTokens = parseInt(formData.get("max_tokens") as string);
  const isDefault = formData.get("is_default") === "on";
  const isActive = formData.get("is_active") === "on";

  const { error } = await supabase
    .from("ai_prompts")
    .update({
      name,
      description: description || null,
      prompt_type: promptType,
      system_prompt: systemPrompt || null,
      user_prompt_template: userPromptTemplate,
      model,
      temperature,
      max_tokens: maxTokens,
      is_default: isDefault,
      is_active: isActive,
    })
    .eq("id", promptId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/admin/prompts");
  redirect("/protected/admin/prompts");
}

export async function deletePrompt(promptId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("ai_prompts")
    .delete()
    .eq("id", promptId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/admin/prompts");
}
