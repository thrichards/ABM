"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

interface TranscriptMessage {
  role?: string;
  message?: string;
  content?: string;
  original_message?: string;
}

/**
 * Generates an AI summary for a call log transcript
 */
export async function generateCallSummary(
  callLogId: string,
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
    // Get the call log with transcript
    const { data: callLog, error: callLogError } = await supabase
      .from("call_logs")
      .select(
        `
        id,
        transcript,
        page_id,
        pages!inner(organization_id)
      `,
      )
      .eq("id", callLogId)
      .single();

    if (callLogError || !callLog) {
      throw new Error("Call log not found");
    }

    // Extract organization_id from the nested pages object
    const organizationId =
      (callLog.pages as unknown as { organization_id: string })
        .organization_id ||
      (
        callLog.pages as unknown as Array<{
          organization_id: string;
        }>
      )[0]?.organization_id;

    if (!organizationId) {
      throw new Error("Organization not found");
    }

    // Verify user has access to this organization
    const { data: orgAccess } = await supabase
      .from("organization_users")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!orgAccess) {
      throw new Error("Unauthorized access to this call log");
    }

    // Convert transcript to text
    const transcript = callLog.transcript as TranscriptMessage[] | null;
    if (!transcript || !Array.isArray(transcript)) {
      throw new Error("No transcript available for this call");
    }

    const transcriptText = transcript
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Agent";
        const content =
          msg.original_message || msg.message || msg.content || "";
        return `${role}: ${content}`;
      })
      .join("\n\n");

    const inputLength = transcriptText.length;

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
        .eq("prompt_type", "meeting_summary")
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      if (!defaultPrompt) {
        // Fallback to hardcoded default
        promptToUse = {
          id: null,
          system_prompt:
            "You are an expert meeting analyst. Create detailed, professional meeting summaries that capture all important information, decisions, action items, and insights.",
          user_prompt_template: `Please create a very detailed meeting summary from the following transcript. Include:

1. **Executive Summary** - A brief 2-3 sentence overview
2. **Key Discussion Points** - Main topics discussed
3. **Decisions Made** - Any conclusions or decisions reached
4. **Action Items** - Tasks and next steps identified
5. **Important Insights** - Notable observations or revelations
6. **Follow-up Required** - Areas needing additional attention

Transcript:
{{transcript}}`,
          model: "claude-sonnet-4-5-20250929",
          temperature: 0.3,
          max_tokens: 4000,
        };
      } else {
        promptToUse = {
          id: defaultPrompt.id,
          system_prompt: defaultPrompt.system_prompt,
          user_prompt_template: defaultPrompt.user_prompt_template,
          model: defaultPrompt.model || "claude-3-5-sonnet-20241022",
          temperature: defaultPrompt.temperature || 0.3,
          max_tokens: defaultPrompt.max_tokens || 4000,
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
        call_log_id: callLogId,
        generation_type: "meeting_summary",
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
 * Gets all generations for a call log
 */
export async function getCallGenerations(callLogId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: generations, error } = await supabase
    .from("ai_generations")
    .select(
      `
      *,
      ai_prompts(name, description)
    `,
    )
    .eq("call_log_id", callLogId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return generations;
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
