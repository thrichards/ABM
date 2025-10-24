import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PagesList } from "./pages-list";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trig ABM - Dashboard",
  description: "Manage your ABM landing pages and campaigns",
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's organization
  const { data: orgUser } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user!.id)
    .single();

  const organizationId = orgUser?.organization_id;

  // Get all pages for this organization
  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">ABM Pages</h2>
          <p className="text-muted-foreground mt-2">
            Create and manage ABM landing pages for your prospects
          </p>
        </div>
        <Link href="/protected/admin/pages/new">
          <Button>Create New Page</Button>
        </Link>
      </div>

      <PagesList pages={pages || []} />
    </div>
  );
}
