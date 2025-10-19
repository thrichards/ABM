"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

/**
 * Generates AI page content based on company information
 */
export async function generatePageContent(
  companyName: string,
  context: string,
  organizationId: string,
  promptId?: string,
  customPrompt?: string,
) {
  const supabase = await createClient();

  // Verify user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Verify user has access to this organization
    const { data: orgAccess } = await supabase
      .from("organization_users")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!orgAccess) {
      throw new Error("Unauthorized access to this organization");
    }

    if (!companyName.trim()) {
      throw new Error("Company name is required");
    }

    // Get or use prompt
    let promptToUse: {
      id: string | null;
      system_prompt: string | null;
      user_prompt_template: string;
      model: string;
      temperature: number;
      max_tokens: number;
    };

    if (customPrompt) {
      // Use custom prompt provided
      promptToUse = {
        id: null,
        system_prompt:
          "You are an expert B2B marketing copywriter. Create compelling, personalized ABM landing page content in markdown format.",
        user_prompt_template: customPrompt,
        model: "claude-sonnet-4-5-20250929",
        temperature: 0.7,
        max_tokens: 2000,
      };
    } else if (promptId) {
      // Use specified prompt
      const { data: prompt, error: promptError } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("id", promptId)
        .eq("organization_id", organizationId)
        .single();

      if (promptError || !prompt) {
        throw new Error("Prompt not found");
      }

      promptToUse = {
        id: prompt.id,
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        model: prompt.model || "claude-sonnet-4-5-20250929",
        temperature: prompt.temperature || 0.7,
        max_tokens: prompt.max_tokens || 2000,
      };
    } else {
      // Use default prompt
      const { data: defaultPrompt } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("prompt_type", "page_content")
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      if (!defaultPrompt) {
        // Fallback to hardcoded default
        promptToUse = {
          id: null,
          system_prompt:
            "You are an expert B2B marketing copywriter. Create compelling, personalized ABM landing page content in markdown format.",
          user_prompt_template: `Create engaging ABM landing page content for {{company_name}}.

Company context:
{{context}}

Create markdown content that includes:
- A compelling introduction paragraph
- 2-3 key value propositions with headers
- Specific benefits relevant to their industry/use case
- A call-to-action section

Use markdown formatting (headers, bold, lists, etc.). Be specific and personalized.`,
          model: "claude-sonnet-4-5-20250929",
          temperature: 0.7,
          max_tokens: 2000,
        };
      } else {
        promptToUse = {
          id: defaultPrompt.id,
          system_prompt: defaultPrompt.system_prompt,
          user_prompt_template: defaultPrompt.user_prompt_template,
          model: defaultPrompt.model || "claude-sonnet-4-5-20250929",
          temperature: defaultPrompt.temperature || 0.7,
          max_tokens: defaultPrompt.max_tokens || 2000,
        };
      }
    }

    // Replace template variables
    const renderedPrompt = promptToUse.user_prompt_template
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{context\}\}/g, context || "No additional context provided")
      .replace(/\{\{transcript\}\}/g, context || "No transcript provided");

    // Create generation record (pending)
    const { data: generation, error: generationError } = await supabase
      .from("ai_generations")
      .insert({
        organization_id: organizationId,
        prompt_id: promptToUse.id,
        call_log_id: null,
        generation_type: "page_content",
        input_text: `Company: ${companyName}\nContext: ${context}`,
        input_length: companyName.length + context.length,
        prompt_used: renderedPrompt,
        model: promptToUse.model,
        temperature: promptToUse.temperature,
        max_tokens: promptToUse.max_tokens,
        status: "processing",
        created_by: user.id,
      })
      .select()
      .single();

    if (generationError || !generation) {
      throw new Error("Failed to create generation record");
    }

    const startTime = Date.now();

    try {
      // Generate the content using Anthropic
      const result = await generateText({
        model: anthropic(promptToUse.model),
        system: promptToUse.system_prompt || undefined,
        prompt: renderedPrompt,
        temperature: promptToUse.temperature,
      });

      const processingTime = Date.now() - startTime;
      const outputLength = result.text.length;

      // Update generation with success
      await supabase
        .from("ai_generations")
        .update({
          output_text: result.text,
          output_length: outputLength,
          status: "completed",
          tokens_used: result.usage.totalTokens,
          prompt_tokens: result.usage.inputTokens || 0,
          completion_tokens: result.usage.outputTokens || 0,
          processing_time_ms: processingTime,
          cost_usd:
            ((result.usage.inputTokens || 0) * 0.003 +
              (result.usage.outputTokens || 0) * 0.015) /
            1000,
        })
        .eq("id", generation.id);

      return {
        success: true,
        generationId: generation.id,
        content: result.text,
        tokensUsed: result.usage.totalTokens,
      };
    } catch (aiError) {
      // Update generation with error
      await supabase
        .from("ai_generations")
        .update({
          status: "failed",
          error_message:
            aiError instanceof Error ? aiError.message : "Unknown error",
        })
        .eq("id", generation.id);

      throw aiError;
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Gets available prompts for the user's organization
 */
export async function getAvailablePrompts(organizationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: prompts, error } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) {
    throw error;
  }

  return prompts;
}
