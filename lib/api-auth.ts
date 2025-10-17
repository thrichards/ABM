import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

export async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      isValid: false,
      error: "Missing or invalid Authorization header",
      status: 401
    };
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

  if (!apiKey.startsWith("trig_")) {
    return {
      isValid: false,
      error: "Invalid API key format",
      status: 401
    };
  }

  // Hash the provided key
  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  console.log("API Key validation:", {
    keyPrefix: apiKey.substring(0, 10),
    hashPrefix: keyHash.substring(0, 10)
  });

  let supabase;
  try {
    // Use service role client to bypass RLS for API key validation
    supabase = createServiceRoleClient();
  } catch (error) {
    console.error("Failed to create service role client:", error);
    return {
      isValid: false,
      error: "Server configuration error. Please ensure SUPABASE_SERVICE_ROLE_KEY is set.",
      status: 500
    };
  }

  // Look up the key in the database
  const { data: keyData, error } = await supabase
    .from("api_keys")
    .select("*, organizations(id, name)")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (error || !keyData) {
    console.error("API key lookup failed:", {
      error: error?.message,
      keyFound: !!keyData,
      keyPrefix: apiKey.substring(0, 10)
    });
    return {
      isValid: false,
      error: "Invalid or expired API key",
      status: 401
    };
  }

  // Check if key has expired
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    // Mark the key as inactive (using service role client)
    await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyData.id);

    return {
      isValid: false,
      error: "API key has expired",
      status: 401
    };
  }

  // Update last_used_at (using service role client)
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyData.id);

  return {
    isValid: true,
    organizationId: keyData.organization_id,
    organizationName: keyData.organizations?.name,
    keyId: keyData.id,
    keyName: keyData.name
  };
}