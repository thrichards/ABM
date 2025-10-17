import { createClient } from "@/lib/supabase/server";
import { PageForm } from "../page-form";

export default async function NewPagePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get user's organization
  const { data: orgUser } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Create New Page</h2>
        <p className="text-muted-foreground mt-2">
          Create a custom ABM landing page for your prospect
        </p>
      </div>

      <PageForm
        organizationId={orgUser?.organization_id}
        userId={user!.id}
      />
    </div>
  );
}