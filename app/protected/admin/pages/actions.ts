"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPage(formData: FormData) {
  const supabase = await createClient();

  const organizationId = formData.get("organizationId") as string;
  const userId = formData.get("userId") as string;
  const slug = formData.get("slug") as string;
  const company_name = formData.get("company_name") as string;
  const title = formData.get("title") as string;
  const hero_title = formData.get("hero_title") as string;
  const hero_subtitle = formData.get("hero_subtitle") as string;
  const body_markdown = formData.get("body_markdown") as string;
  const meeting_transcript = formData.get("meeting_transcript") as string;
  const is_published = formData.get("is_published") === "on";

  // Email gate settings
  const email_gate_enabled = formData.get("email_gate_enabled") === "on";
  const email_gate_type = formData.get("email_gate_type") as string;
  const email_gate_domain = formData.get("email_gate_domain") as string;
  const email_gate_allowlist_raw = formData.get("email_gate_allowlist") as string;
  const email_gate_allowlist = email_gate_allowlist_raw
    ? email_gate_allowlist_raw.split("\n").map(email => email.trim()).filter(email => email)
    : null;

  const { error } = await supabase.from("pages").insert({
    organization_id: organizationId,
    slug,
    company_name,
    title: title || null,
    hero_title: hero_title || null,
    hero_subtitle: hero_subtitle || null,
    body_markdown: body_markdown || null,
    meeting_transcript: meeting_transcript || null,
    is_published,
    created_by: userId,
    email_gate_enabled,
    email_gate_type: email_gate_enabled ? email_gate_type : null,
    email_gate_domain: email_gate_enabled && email_gate_type === "domain" ? email_gate_domain : null,
    email_gate_allowlist: email_gate_enabled && email_gate_type === "allowlist" ? email_gate_allowlist : null,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "A page with this slug already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/protected/admin");
  revalidatePath(`/${slug}`);
  return { success: true };
}

export async function updatePage(formData: FormData) {
  const supabase = await createClient();

  const pageId = formData.get("pageId") as string;
  const slug = formData.get("slug") as string;
  const company_name = formData.get("company_name") as string;
  const title = formData.get("title") as string;
  const hero_title = formData.get("hero_title") as string;
  const hero_subtitle = formData.get("hero_subtitle") as string;
  const body_markdown = formData.get("body_markdown") as string;
  const meeting_transcript = formData.get("meeting_transcript") as string;
  const is_published = formData.get("is_published") === "on";

  // Email gate settings
  const email_gate_enabled = formData.get("email_gate_enabled") === "on";
  const email_gate_type = formData.get("email_gate_type") as string;
  const email_gate_domain = formData.get("email_gate_domain") as string;
  const email_gate_allowlist_raw = formData.get("email_gate_allowlist") as string;
  const email_gate_allowlist = email_gate_allowlist_raw
    ? email_gate_allowlist_raw.split("\n").map(email => email.trim()).filter(email => email)
    : null;

  const { error } = await supabase
    .from("pages")
    .update({
      slug,
      company_name,
      title: title || null,
      hero_title: hero_title || null,
      hero_subtitle: hero_subtitle || null,
      body_markdown: body_markdown || null,
      meeting_transcript: meeting_transcript || null,
      is_published,
      email_gate_enabled,
      email_gate_type: email_gate_enabled ? email_gate_type : null,
      email_gate_domain: email_gate_enabled && email_gate_type === "domain" ? email_gate_domain : null,
      email_gate_allowlist: email_gate_enabled && email_gate_type === "allowlist" ? email_gate_allowlist : null,
    })
    .eq("id", pageId);

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "A page with this slug already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/protected/admin");
  revalidatePath(`/${slug}`);
  return { success: true };
}

export async function deletePage(pageId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("pages").delete().eq("id", pageId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/admin");
  return { success: true };
}