import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptsList } from "./prompts-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trig ABM - Prompts",
  description: "Manage your AI prompts",
};

export default async function PromptsPage() {
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

  if (!orgUser) {
    redirect("/protected/admin");
  }

  // Get all prompts for the organization
  const { data: prompts } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("organization_id", orgUser.organization_id)
    .order("is_default", { ascending: false })
    .order("prompt_type")
    .order("name");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/protected/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Prompts</h1>
            <p className="text-muted-foreground">
              Manage AI prompt templates for transcript summarization
            </p>
          </div>
          <Link href="/protected/admin/prompts/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Prompt
            </Button>
          </Link>
        </div>
      </div>

      <PromptsList
        prompts={prompts || []}
        organizationId={orgUser.organization_id}
        userRole={orgUser.role}
      />
    </div>
  );
}
