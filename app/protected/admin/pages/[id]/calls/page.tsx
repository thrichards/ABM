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

  const formatCredits = (credits: number | null) => {
    if (credits === null || credits === undefined) return "N/A";
    return credits.toLocaleString();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Calculate macro stats
  const totalCalls = callLogs?.length || 0;
  const totalDuration = callLogs?.reduce((sum, log) => sum + (log.call_duration_seconds || 0), 0) || 0;
  const totalCredits = callLogs?.reduce((sum, log) => sum + (log.elevenlabs_total_credits || log.call_cost_usd || 0), 0) || 0;

  // Count successful calls
  const successfulCalls = callLogs?.filter(log => {
    const analysis = log.analysis as { call_successful?: string } | null;
    return analysis?.call_successful === "success";
  }).length || 0;

  // Get most recent call date
  const mostRecentCall = callLogs?.[0]?.created_at
    ? new Date(callLogs[0].created_at)
    : null;

  // Calculate time since most recent call
  const getTimeSinceLastCall = () => {
    if (!mostRecentCall) return "No calls yet";
    const now = new Date();
    const diffMs = now.getTime() - mostRecentCall.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
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

      {/* Macro Stats */}
      {callLogs && callLogs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">{totalCalls}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Calls
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {successfulCalls}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Successful
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalCalls > 0 ? `${Math.round((successfulCalls / totalCalls) * 100)}%` : '0%'}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Duration
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalCalls > 0 ? `${Math.round(totalDuration / totalCalls)}s avg` : '0s avg'}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold font-mono">{totalCredits.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Credits
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last call: {getTimeSinceLastCall()}
            </div>
          </div>
        </div>
      )}

      {!callLogs || callLogs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            No calls recorded yet. Calls will appear here after prospects
            interact with the voice agent.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {callLogs.map((log) => {
            const analysis = log.analysis as {
              call_successful?: string;
              call_summary_title?: string;
              transcript_summary?: string;
              evaluation_criteria_results?: Record<string, unknown>;
              data_collection_results?: Record<string, unknown>;
            } | null;

            return (
              <div
                key={log.id}
                className="border rounded-lg bg-card overflow-hidden"
              >
                {/* Analysis - Most Prominent */}
                {analysis && (
                  <div className="bg-primary/5 border-b p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          {analysis.call_summary_title || "Call Summary"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${
                              analysis.call_successful === "success"
                                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                            }`}
                          >
                            {analysis.call_successful === "success"
                              ? "✓ Successful"
                              : "⚠ Needs Follow-up"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {analysis.transcript_summary && (
                      <p className="text-base leading-relaxed">
                        {analysis.transcript_summary}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-6">
                  {/* Contact Info & Call Details */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                        Contact Information
                      </h4>
                      <dl className="space-y-2">
                        {log.user_email && (
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Email
                            </dt>
                            <dd className="font-medium">{log.user_email}</dd>
                          </div>
                        )}
                        {log.company_name && (
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Company
                            </dt>
                            <dd className="font-medium">{log.company_name}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                        Call Metrics
                      </h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Duration
                          </dt>
                          <dd className="font-medium">
                            {formatDuration(log.call_duration_seconds)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            ElevenLabs Call Credits
                          </dt>
                          <dd className="font-medium">
                            {formatCredits(log.elevenlabs_call_credits)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            ElevenLabs LLM Credits
                          </dt>
                          <dd className="font-medium">
                            {formatCredits(log.elevenlabs_llm_credits)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Total Credits
                          </dt>
                          <dd className="font-medium font-mono">
                            {formatCredits(log.elevenlabs_total_credits)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Time
                          </dt>
                          <dd className="font-medium">
                            {formatDate(log.started_at)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Transcript - Collapsible */}
                  {log.transcript &&
                    Array.isArray(log.transcript) &&
                    log.transcript.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
                          <span className="group-open:rotate-90 transition-transform">
                            ▶
                          </span>
                          Full Transcript
                        </summary>
                        <div className="bg-secondary/20 rounded-lg p-4 mt-2 space-y-3">
                          {log.transcript.map(
                            (
                              message: {
                                role?: string;
                                message?: string;
                                content?: string;
                                original_message?: string;
                              },
                              idx: number,
                            ) => (
                              <div key={idx} className="flex gap-3">
                                <div
                                  className={`flex-shrink-0 w-16 text-xs font-semibold ${
                                    message.role === "user"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-purple-600 dark:text-purple-400"
                                  }`}
                                >
                                  {message.role === "user" ? "User" : "Agent"}
                                </div>
                                <div className="flex-1 text-sm">
                                  {message.original_message ||
                                    message.message ||
                                    message.content}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </details>
                    )}

                  {/* Technical Details - Collapsed by default */}
                  <details className="group mt-4">
                    <summary className="cursor-pointer text-xs text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
                      <span className="group-open:rotate-90 transition-transform">
                        ▶
                      </span>
                      Technical Details
                    </summary>
                    <div className="mt-2 text-xs font-mono text-muted-foreground">
                      Conversation ID: {log.conversation_id}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
