import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApiKeysList } from "./api-keys-list";

export default async function ApiKeysPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's organization
  const { data: orgUser } = await supabase
    .from("organization_users")
    .select("organization_id, role, organizations(id, name)")
    .eq("user_id", user.id)
    .single();

  if (!orgUser) {
    redirect("/protected/onboarding");
  }

  // Get existing API keys for the organization
  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("*")
    .eq("organization_id", orgUser.organization_id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-circular">API Keys</h2>
        <p className="text-muted-foreground mt-2">
          Manage API keys for programmatic access to create and update ABM pages
        </p>
      </div>

      <ApiKeysList
        organizationId={orgUser.organization_id}
        userId={user.id}
        existingKeys={apiKeys || []}
        isAdmin={orgUser.role === 'admin'}
      />
    </div>
  );
}