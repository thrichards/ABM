import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import logo from "@/app/trigMark.svg";

export const metadata: Metadata = {
  title: "Trig | ABM Builder",
  description: "ABM Builder Admin Dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user belongs to an organization
  const { data: orgUser } = await supabase
    .from("organization_users")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  if (!orgUser) {
    // User doesn't belong to any organization yet
    redirect("/protected/onboarding");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              {/* Logo and Title */}
              <div className="flex items-center gap-3">
                <Image
                  src={logo}
                  alt="Trig Logo"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
                <div className="h-10 w-px bg-border" />
                <h1 className="text-2xl font-semibold">ABM Builder</h1>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center gap-6 ml-6">
                <Link
                  href="/protected/admin"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Pages
                </Link>
                <Link
                  href="/protected/admin/prompts"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  AI Prompts
                </Link>
                <Link
                  href="/protected/admin/api-keys"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  API Keys
                </Link>
              </nav>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <form action="/auth/signout" method="post">
                <button className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}