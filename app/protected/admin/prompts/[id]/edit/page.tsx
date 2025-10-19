import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PromptForm } from "../../prompt-form";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  if (!orgUser || orgUser.role !== "admin") {
    redirect("/protected/admin/prompts");
  }

  // Get the prompt
  const { data: prompt } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgUser.organization_id)
    .single();

  if (!prompt) {
    redirect("/protected/admin/prompts");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/protected/admin/prompts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Prompts
        </Link>
        <h1 className="text-3xl font-bold mb-2">Edit Prompt</h1>
        <p className="text-muted-foreground">{prompt.name}</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <PromptForm
          organizationId={orgUser.organization_id}
          prompt={prompt}
        />
      </div>
    </div>
  );
}
