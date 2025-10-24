import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExportButton } from "./export-button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trig ABM - Email Captures",
  description: "View captured emails from your ABM page",
};

// Helper function to format date consistently
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

export default async function PageLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get the page details
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .single();

  if (!page) {
    notFound();
  }

  // Get captured emails for this page
  const { data: captures } = await supabase
    .from("page_email_captures")
    .select("*")
    .eq("page_id", id)
    .order("captured_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          href="/protected/admin"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Pages
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold">Email Captures</h2>
            <p className="text-muted-foreground mt-2">
              Page: <span className="font-medium">{page.title || page.company_name}</span> ({page.slug})
            </p>
          </div>
          {captures && captures.length > 0 && (
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{captures.length}</div>
              <div className="text-sm text-muted-foreground mb-4">Total Leads</div>
              <ExportButton emails={captures.map(c => c.email)} />
            </div>
          )}
        </div>
      </div>

      {!page.email_gate_enabled && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg mb-6">
          Email gate is not enabled for this page. Enable it in the page settings to start capturing emails.
        </div>
      )}

      {captures && captures.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Captured
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {captures.map((capture) => (
                  <tr key={capture.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {capture.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(capture.captured_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No emails captured yet for this page.
          </p>
        </div>
      )}
    </div>
  );
}