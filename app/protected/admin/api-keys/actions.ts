"use server";

import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function generateApiKey({
  organizationId,
  userId,
  name,
  expiryDays,
}: {
  organizationId: string;
  userId: string;
  name: string;
  expiryDays: number;
}) {
  const supabase = await createClient();

  // Generate a random API key
  const rawKey = `trig_${randomBytes(32).toString('hex')}`;

  // Hash the key for storage
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  // Get the prefix for display (first 10 chars)
  const keyPrefix = rawKey.substring(0, 10);

  // Calculate expiry date
  const expiresAt = expiryDays > 0
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Store the hashed key in database
  const { error } = await supabase
    .from("api_keys")
    .insert({
      organization_id: organizationId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      expires_at: expiresAt,
      created_by: userId,
      is_active: true,
    });

  if (error) {
    console.error("Error creating API key:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/admin/api-keys");

  // Return the raw key only once (user must save it)
  return { success: true, apiKey: rawKey };
}

export async function revokeApiKey(keyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", keyId);

  if (error) {
    console.error("Error revoking API key:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/admin/api-keys");
  return { success: true };
}