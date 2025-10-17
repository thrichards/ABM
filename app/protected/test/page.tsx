import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Try different queries to debug
  const { data: orgUser1, error: error1 } = await supabase
    .from("organization_users")
    .select("*")
    .eq("user_id", user.id);

  const { data: orgUser2, error: error2 } = await supabase
    .from("organization_users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: allOrgUsers, error: error3 } = await supabase
    .from("organization_users")
    .select("*");

  const { data: orgs, error: error4 } = await supabase
    .from("organizations")
    .select("*");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>

      <div className="space-y-4">
        <div>
          <h2 className="font-bold">User Info:</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify({ id: user.id, email: user.email }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold">Organization Users (array query):</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify({ data: orgUser1, error: error1?.message }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold">Organization Users (single query):</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify({ data: orgUser2, error: error2?.message }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold">All Organization Users:</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify({ data: allOrgUsers, error: error3?.message }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold">All Organizations:</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify({ data: orgs, error: error4?.message }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}