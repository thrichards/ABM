"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const userId = formData.get("userId") as string;

  // Use the database function to create org and add user atomically
  const { data, error } = await supabase
    .rpc("create_organization_with_admin", {
      org_name: name,
      org_slug: slug,
      admin_user_id: userId,
    });

  if (error) {
    return { error: error.message };
  }

  if (data && data.length > 0) {
    const result = data[0];
    if (!result.success) {
      return { error: result.message };
    }
  }

  revalidatePath("/protected/admin");
  return { success: true };
}