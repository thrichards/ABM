import { createPublicClient } from "@/lib/supabase/public";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, email } = body;

    if (!pageId || !email) {
      return NextResponse.json(
        { error: "Page ID and email are required" },
        { status: 400 }
      );
    }

    // Use public Supabase client for unauthenticated access
    const supabase = createPublicClient();

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    // Try to insert the email capture
    // If it already exists (duplicate), that's fine - just ignore the error
    const { error } = await supabase
      .from("page_email_captures")
      .insert({
        page_id: pageId,
        email: email.toLowerCase(),
        first_name: null,
        last_name: null,
        company: null,
        ip_address: ip,
        user_agent: userAgent,
        captured_at: new Date().toISOString(),
      });

    if (error) {
      // Check if it's a duplicate key error (email already captured)
      // Code 23505 is the PostgreSQL unique violation error code
      if (error.code === '23505') {
        // This is fine - the email was already captured previously
        return NextResponse.json({ success: true, existing: true });
      }

      console.error("Failed to capture email:", error);
      return NextResponse.json(
        { error: "Failed to capture email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in capture-email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}