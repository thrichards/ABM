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
    const successful = searchParams.get("successful");

    // Build query
    let query = supabase
      .from("call_logs")
      .select("*", { count: "exact" })
      .eq("page_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply date filters
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data: calls, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Filter by success status if requested (done in JS since it's a JSONB field)
    let filteredCalls = calls;
    if (successful !== null) {
      const isSuccessful = successful === "true";
      filteredCalls = calls?.filter(call => {
        const analysis = call.analysis as { call_successful?: string } | null;
        const callSuccessful = analysis?.call_successful === "success";
        return isSuccessful ? callSuccessful : !callSuccessful;
      });
    }

    // Calculate summary stats
    const totalCalls = filteredCalls?.length || 0;
    const totalDuration = filteredCalls?.reduce(
      (sum, call) => sum + (call.call_duration_seconds || 0),
      0
    ) || 0;
    const totalCredits = filteredCalls?.reduce(
      (sum, call) => sum + (call.elevenlabs_total_credits || call.call_cost_usd || 0),
      0
    ) || 0;
    const successfulCalls = filteredCalls?.filter(call => {
      const analysis = call.analysis as { call_successful?: string } | null;
      return analysis?.call_successful === "success";
    }).length || 0;

    return NextResponse.json({
      calls: filteredCalls,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      },
      summary: {
        total_calls: totalCalls,
        successful_calls: successfulCalls,
        success_rate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
        total_duration_seconds: totalDuration,
        average_duration_seconds: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
        total_credits: totalCredits
      }
    });
  } catch (error) {
    console.error("Error fetching call logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
