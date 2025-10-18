import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Initialize Supabase client with service role for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Verify HMAC signature from ElevenLabs
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Signature format: "t=timestamp,v0=hash"
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const hashPart = parts.find((p) => p.startsWith("v0="));

    if (!timestampPart || !hashPart) {
      return false;
    }

    const timestamp = timestampPart.split("=")[1];
    const receivedHash = hashPart.split("=")[1];

    // Check timestamp is within 30 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);
    if (Math.abs(currentTime - requestTime) > 1800) {
      console.error("Webhook timestamp too old");
      return false;
    }

    // Compute HMAC
    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(signedPayload);
    const computedHash = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(receivedHash),
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("ElevenLabs-Signature") || "";
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    const body = JSON.parse(rawBody);

    // Only handle post_call_transcription events
    if (body.type !== "post_call_transcription") {
      return NextResponse.json({ message: "Event type not handled" });
    }

    const data = body.data;

    // Log the full payload for debugging
    console.log("Webhook payload:", JSON.stringify(body, null, 2));

    // Extract dynamic variables from the correct location
    const dynamicVars =
      data.conversation_initiation_client_data?.dynamic_variables || {};

    // Extract user email from dynamic variables
    const userEmail = dynamicVars.userEmail || null;

    // Extract company name from dynamic variables
    const companyName = dynamicVars.companyName || null;

    // Find the page associated with this conversation
    // Check for pageId in dynamic variables
    let pageId = dynamicVars.pageId || null;

    console.log("Extracted pageId:", pageId);
    console.log("Extracted companyName:", companyName);
    console.log("Extracted userEmail:", userEmail);

    if (!pageId && companyName) {
      // Try to find page by company name
      console.log("Attempting to find page by company_name:", companyName);
      const { data: pages, error: pageError } = await supabase
        .from("pages")
        .select("id")
        .ilike("company_name", companyName)
        .limit(1);

      if (pageError) {
        console.error("Error querying pages:", pageError);
      }

      if (pages && pages.length > 0) {
        pageId = pages[0].id;
        console.log("Found page by company_name:", pageId);
      } else {
        console.log("No page found with company_name:", companyName);
      }
    }

    if (!pageId) {
      console.error("Could not determine page_id for call log");
      console.error("Available data:", {
        metadata: data.metadata,
        dynamic_variables: data.dynamic_variables,
        variables: data.variables,
        custom_data: data.custom_data,
        companyName,
      });
      // Still return 200 to avoid webhook being disabled
      return NextResponse.json({
        message: "Page not found, but acknowledged",
      });
    }

    // Insert call log
    const { error: insertError } = await supabase.from("call_logs").insert({
      page_id: pageId,
      conversation_id: data.conversation_id,
      agent_id: data.agent_id,
      call_duration_seconds: data.call_duration_seconds,
      call_cost_usd: data.call_cost_usd,
      started_at: data.started_at ? new Date(data.started_at) : null,
      ended_at: data.ended_at ? new Date(data.ended_at) : null,
      transcript: data.transcript || null,
      analysis: data.analysis || null,
      user_email: userEmail,
      company_name: companyName,
      webhook_payload: body,
    });

    if (insertError) {
      console.error("Error inserting call log:", insertError);
      return NextResponse.json(
        { error: "Failed to store call log" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
