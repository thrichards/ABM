import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validateApiKey } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const MAX_TRANSCRIPT_SIZE = 65000; // 65KB limit for ElevenLabs

async function generateContent(
  companyName: string,
  context: string,
  organizationId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  // Get default page content prompt
  const { data: prompt } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("prompt_type", "page_content")
    .eq("is_default", true)
    .eq("is_active", true)
    .single();

  if (!prompt) {
    return null; // No default prompt, skip generation
  }

  const renderedPrompt = prompt.user_prompt_template
    .replace(/\{\{company_name\}\}/g, companyName)
    .replace(/\{\{context\}\}/g, context || "No additional context provided")
    .replace(/\{\{transcript\}\}/g, context || "No transcript provided");

  try {
    const result = await generateText({
      model: anthropic(prompt.model || "claude-sonnet-4-5-20250929"),
      system: prompt.system_prompt || undefined,
      prompt: renderedPrompt,
      temperature: prompt.temperature || 0.7,
    });

    // Log the generation
    await supabase.from("ai_generations").insert({
      organization_id: organizationId,
      prompt_id: prompt.id,
      generation_type: "page_content",
      input_text: `Company: ${companyName}\nContext: ${context}`,
      input_length: companyName.length + (context?.length || 0),
      prompt_used: renderedPrompt,
      output_text: result.text,
      output_length: result.text.length,
      model: prompt.model,
      temperature: prompt.temperature,
      status: "completed",
      tokens_used: result.usage.totalTokens,
      prompt_tokens: result.usage.inputTokens || 0,
      completion_tokens: result.usage.outputTokens || 0,
      cost_usd:
        ((result.usage.inputTokens || 0) * 0.003 +
          (result.usage.outputTokens || 0) * 0.015) /
        1000,
    });

    return result.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
}

async function condenseTranscript(
  transcript: string,
  organizationId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  // Get default transcript condense prompt
  const { data: prompt } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("prompt_type", "transcript_condense")
    .eq("is_default", true)
    .eq("is_active", true)
    .single();

  if (!prompt) {
    return transcript; // No default prompt, return original
  }

  const renderedPrompt = prompt.user_prompt_template.replace(
    /\{\{transcript\}\}/g,
    transcript
  );

  try {
    const result = await generateText({
      model: anthropic(prompt.model || "claude-sonnet-4-5-20250929"),
      system: prompt.system_prompt || undefined,
      prompt: renderedPrompt,
      temperature: prompt.temperature || 0.2,
    });

    // Log the generation
    await supabase.from("ai_generations").insert({
      organization_id: organizationId,
      prompt_id: prompt.id,
      generation_type: "transcript_condense",
      input_text: transcript,
      input_length: transcript.length,
      prompt_used: renderedPrompt,
      output_text: result.text,
      output_length: result.text.length,
      model: prompt.model,
      temperature: prompt.temperature,
      status: "completed",
      tokens_used: result.usage.totalTokens,
      prompt_tokens: result.usage.inputTokens || 0,
      completion_tokens: result.usage.outputTokens || 0,
      cost_usd:
        ((result.usage.inputTokens || 0) * 0.003 +
          (result.usage.outputTokens || 0) * 0.015) /
        1000,
    });

    return result.text;
  } catch (error) {
    console.error("Error condensing transcript:", error);
    return transcript; // Return original on error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    // Use service role client to bypass RLS for API operations
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const {
      slug,
      company_name,
      title,
      hero_title,
      hero_subtitle,
      body_markdown,
      meeting_transcript,
      is_published = false,
      email_gate_enabled = false,
      email_gate_type = "any",
      email_gate_domain,
      email_gate_allowlist,
    } = body;

    // Validate required fields
    if (!slug || !company_name) {
      return NextResponse.json(
        { error: "slug and company_name are required" },
        { status: 400 }
      );
    }

    // Use the organization from the API key
    const organizationId = auth.organizationId;

    // Auto-generate body content if not provided
    let finalBodyMarkdown = body_markdown;
    if (!finalBodyMarkdown) {
      console.log("Auto-generating page content for", company_name);
      const generatedContent = await generateContent(
        company_name,
        meeting_transcript || "",
        organizationId,
        supabase
      );
      if (generatedContent) {
        finalBodyMarkdown = generatedContent;
      }
    }

    // Condense transcript if too large
    let finalTranscript = meeting_transcript;
    if (meeting_transcript && meeting_transcript.length > MAX_TRANSCRIPT_SIZE) {
      console.log(
        `Transcript too large (${meeting_transcript.length} bytes), condensing...`
      );
      finalTranscript = await condenseTranscript(
        meeting_transcript,
        organizationId,
        supabase
      );
      console.log(`Condensed to ${finalTranscript.length} bytes`);
    }

    // Create the page
    const { data: page, error } = await supabase
      .from("pages")
      .insert({
        organization_id: organizationId,
        slug,
        company_name,
        title: title || null,
        hero_title: hero_title || null,
        hero_subtitle: hero_subtitle || null,
        body_markdown: finalBodyMarkdown || null,
        meeting_transcript: finalTranscript || null,
        is_published,
        created_by: null, // API-created pages don't have a user
        email_gate_enabled,
        email_gate_type: email_gate_enabled ? email_gate_type : null,
        email_gate_domain: email_gate_enabled && email_gate_type === "domain" ? email_gate_domain : null,
        email_gate_allowlist: email_gate_enabled && email_gate_type === "allowlist" ? email_gate_allowlist : null,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      page,
      url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/${slug}`
    });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    // Use service role client to bypass RLS for API operations
    const supabase = createServiceRoleClient();

    // Get all pages for the organization from API key
    const { data: pages, error } = await supabase
      .from("pages")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}