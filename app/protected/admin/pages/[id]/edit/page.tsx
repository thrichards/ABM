import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageForm } from "../../page-form";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get the page
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .single();

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Edit Page</h2>
        <p className="text-muted-foreground mt-2">
          Update your custom ABM landing page
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <PageForm
          organizationId={page.organization_id}
          userId={user!.id}
          page={page}
        />
      </div>
    </div>
  );
}