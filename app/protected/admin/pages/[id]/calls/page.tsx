import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CallLogsPage({
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

  // Get page details
  const { data: page } = await supabase
    .from("pages")
    .select("id, title, company_name, slug")
    .eq("id", id)
    .single();

  if (!page) {
    redirect("/protected/admin");
  }

  // Get call logs for this page
  const { data: callLogs } = await supabase
    .from("call_logs")
    .select("*")
    .eq("page_id", id)
    .order("created_at", { ascending: false });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatCost = (cost: number | null) => {
    if (!cost) return "N/A";
    return `$${cost.toFixed(4)}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/protected/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pages
        </Link>
        <h1 className="text-3xl font-bold mb-2">Call Logs</h1>
        <p className="text-muted-foreground">
          {page.title || page.company_name} - {page.slug}
        </p>
      </div>

      {!callLogs || callLogs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            No calls recorded yet. Calls will appear here after prospects
            interact with the voice agent.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {callLogs.map((log) => (
            <div
              key={log.id}
              className="border rounded-lg p-6 bg-card hover:shadow-md transition-shadow"
            >
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-semibold mb-2">Call Details</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Duration:</dt>
                      <dd className="font-medium">
                        {formatDuration(log.call_duration_seconds)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Cost:</dt>
                      <dd className="font-medium">
                        {formatCost(log.call_cost_usd)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Started:</dt>
                      <dd className="font-medium">
                        {formatDate(log.started_at)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ended:</dt>
                      <dd className="font-medium">
                        {formatDate(log.ended_at)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Contact Info</h3>
                  <dl className="space-y-1 text-sm">
                    {log.user_email && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Email:</dt>
                        <dd className="font-medium">{log.user_email}</dd>
                      </div>
                    )}
                    {log.company_name && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Company:</dt>
                        <dd className="font-medium">{log.company_name}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        Conversation ID:
                      </dt>
                      <dd className="font-mono text-xs">
                        {log.conversation_id}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Transcript */}
              {log.transcript && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Transcript</h3>
                  <div className="bg-secondary/20 rounded p-4 max-h-60 overflow-y-auto">
                    {Array.isArray(log.transcript) ? (
                      <div className="space-y-2">
                        {log.transcript.map(
                          (
                            message: {
                              role?: string;
                              message?: string;
                              content?: string;
                            },
                            idx: number,
                          ) => (
                            <div key={idx} className="text-sm">
                              <span className="font-semibold">
                                {message.role === "user" ? "User" : "Agent"}:
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {message.message || message.content}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {JSON.stringify(log.transcript, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Analysis */}
              {log.analysis && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Analysis</h3>
                  <div className="bg-secondary/20 rounded p-4">
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {JSON.stringify(log.analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
