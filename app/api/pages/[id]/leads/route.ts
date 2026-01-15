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

    // Get the page to verify ownership
    const { data: page } = await supabase
      .from("pages")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!page) {
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const email = searchParams.get("email");
    const domain = searchParams.get("domain");

    // Build query
    let query = supabase
      .from("page_email_captures")
      .select("*", { count: "exact" })
      .eq("page_id", id)
      .order("captured_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply date filters
    if (from) {
      query = query.gte("captured_at", from);
    }
    if (to) {
      query = query.lte("captured_at", to);
    }

    // Apply email filter
    if (email) {
      query = query.ilike("email", `%${email}%`);
    }

    // Apply domain filter
    if (domain) {
      query = query.ilike("email", `%@${domain}`);
    }

    const { data: leads, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Calculate domain breakdown
    const domainCounts: Record<string, number> = {};
    leads?.forEach(lead => {
      const emailDomain = lead.email.split("@")[1];
      if (emailDomain) {
        domainCounts[emailDomain] = (domainCounts[emailDomain] || 0) + 1;
      }
    });

    // Sort domains by count
    const topDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    return NextResponse.json({
      leads,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      },
      summary: {
        total_leads: count || 0,
        top_domains: topDomains
      }
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
