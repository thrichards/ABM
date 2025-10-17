import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validateApiKey } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

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
        body_markdown: body_markdown || null,
        meeting_transcript: meeting_transcript || null,
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