import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validateApiKey } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Get the page
    const { data: page, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Check if the API key's organization matches the page's organization
    if (page.organization_id !== auth.organizationId) {
      return NextResponse.json(
        { error: "You don't have access to this page" },
        { status: 403 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Get the page to check organization
    const { data: existingPage } = await supabase
      .from("pages")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!existingPage) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Check if the API key's organization matches the page's organization
    if (existingPage.organization_id !== auth.organizationId) {
      return NextResponse.json(
        { error: "You don't have access to this page" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      slug,
      company_name,
      title,
      hero_title,
      hero_subtitle,
      body_markdown,
      meeting_transcript,
      is_published,
      email_gate_enabled,
      email_gate_type,
      email_gate_domain,
      email_gate_allowlist,
    } = body;

    // Update the page
    const { data: page, error } = await supabase
      .from("pages")
      .update({
        ...(slug !== undefined && { slug }),
        ...(company_name !== undefined && { company_name }),
        ...(title !== undefined && { title: title || null }),
        ...(hero_title !== undefined && { hero_title: hero_title || null }),
        ...(hero_subtitle !== undefined && { hero_subtitle: hero_subtitle || null }),
        ...(body_markdown !== undefined && { body_markdown: body_markdown || null }),
        ...(meeting_transcript !== undefined && { meeting_transcript: meeting_transcript || null }),
        ...(is_published !== undefined && { is_published }),
        ...(email_gate_enabled !== undefined && { email_gate_enabled }),
        ...(email_gate_type !== undefined && {
          email_gate_type: email_gate_enabled ? email_gate_type : null
        }),
        ...(email_gate_domain !== undefined && {
          email_gate_domain: email_gate_enabled && email_gate_type === "domain" ? email_gate_domain : null
        }),
        ...(email_gate_allowlist !== undefined && {
          email_gate_allowlist: email_gate_enabled && email_gate_type === "allowlist" ? email_gate_allowlist : null
        }),
      })
      .eq("id", id)
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
      url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/${page.slug}`
    });
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Get the page to check organization
    const { data: existingPage } = await supabase
      .from("pages")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!existingPage) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Check if the API key's organization matches the page's organization
    if (existingPage.organization_id !== auth.organizationId) {
      return NextResponse.json(
        { error: "You don't have access to this page" },
        { status: 403 }
      );
    }

    // Delete the page
    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}