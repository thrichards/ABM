import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check organization membership
  const { data: orgUser, error } = await supabase
    .from("organization_users")
    .select("*")
    .eq("user_id", user.id);

  // Check organizations
  const { data: orgs, error: orgError } = await supabase
    .from("organizations")
    .select("*");

  return NextResponse.json({
    userId: user.id,
    userEmail: user.email,
    orgUser,
    orgUserError: error?.message,
    organizations: orgs,
    orgError: orgError?.message,
  });
}