"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

/**
 * Generates an AI summary for a raw transcript text
 */
export async function generateTranscriptSummary(
  transcriptText: string,
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

    const inputLength = transcriptText.length;

    if (!transcriptText.trim()) {
      throw new Error("No transcript text provided");
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
          "You are an expert meeting analyst. Create detailed, professional meeting summaries.",
        user_prompt_template: customPrompt,
        model: "claude-sonnet-4-5-20250929",
        temperature: 0.3,
        max_tokens: 4000,
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
        temperature: prompt.temperature || 0.3,
        max_tokens: prompt.max_tokens || 4000,
      };
    } else {
      // Use default prompt
      const { data: defaultPrompt } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("prompt_type", "transcript_condense")
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      if (!defaultPrompt) {
        // Fallback to hardcoded default for condensing
        promptToUse = {
          id: null,
          system_prompt:
            "You are an expert at condensing conversations while preserving all critical information. Your goal is to reduce length while maintaining clarity and completeness.",
          user_prompt_template: `Please condense the following transcript to approximately 50% of its original length while preserving all important information, context, and meaning:

{{transcript}}`,
          model: "claude-sonnet-4-5-20250929",
          temperature: 0.2,
          max_tokens: 3000,
        };
      } else {
        promptToUse = {
          id: defaultPrompt.id,
          system_prompt: defaultPrompt.system_prompt,
          user_prompt_template: defaultPrompt.user_prompt_template,
          model: defaultPrompt.model || "claude-sonnet-4-5-20250929",
          temperature: defaultPrompt.temperature || 0.2,
          max_tokens: defaultPrompt.max_tokens || 3000,
        };
      }
    }

    // Replace template variables
    const renderedPrompt = promptToUse.user_prompt_template.replace(
      /\{\{transcript\}\}/g,
      transcriptText,
    );

    // Create generation record (pending)
    const { data: generation, error: generationError } = await supabase
      .from("ai_generations")
      .insert({
        organization_id: organizationId,
        prompt_id: promptToUse.id,
        call_log_id: null, // Not associated with a call log
        generation_type: "transcript_condense",
        input_text: transcriptText,
        input_length: inputLength,
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
      // Generate the summary using Anthropic
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
          // Anthropic pricing (approximate - update with actual pricing)
          cost_usd:
            ((result.usage.inputTokens || 0) * 0.003 +
              (result.usage.outputTokens || 0) * 0.015) /
            1000,
        })
        .eq("id", generation.id);

      return {
        success: true,
        generationId: generation.id,
        summary: result.text,
        tokensUsed: result.usage.totalTokens,
        originalLength: inputLength,
        condensedLength: outputLength,
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
    console.error("Error generating summary:", error);
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
