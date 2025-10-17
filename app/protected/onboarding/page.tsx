import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user already belongs to an organization
  const { data: existingOrg } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (existingOrg) {
    redirect("/protected/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome to ABM Platform</h2>
          <p className="mt-2 text-muted-foreground">
            Let&apos;s set up your organization to get started
          </p>
        </div>
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  );
}