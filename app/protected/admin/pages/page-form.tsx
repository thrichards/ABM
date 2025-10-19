"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPage, updatePage } from "./actions";
import { TranscriptSummaryPanel } from "@/components/transcript-summary-panel";
import { PageContentPanel } from "@/components/page-content-panel";

interface PageFormProps {
  organizationId?: string;
  userId: string;
  page?: {
    id: string;
    slug: string;
    title?: string;
    company_name?: string;
    hero_title?: string;
    hero_subtitle?: string;
    meeting_transcript?: string;
    body_markdown?: string;
    is_published: boolean;
    email_gate_enabled?: boolean;
    email_gate_type?: string;
    email_gate_domain?: string;
    email_gate_allowlist?: string[];
  };
}

export function PageForm({ organizationId, userId, page }: PageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailGateEnabled, setEmailGateEnabled] = useState(page?.email_gate_enabled || false);
  const [emailGateType, setEmailGateType] = useState(page?.email_gate_type || "any");
  const [emailAllowlist, setEmailAllowlist] = useState(page?.email_gate_allowlist?.join("\n") || "");
  const [meetingTranscript, setMeetingTranscript] = useState(
    page?.meeting_transcript || "",
  );
  const [bodyMarkdown, setBodyMarkdown] = useState(
    page?.body_markdown || "",
  );
  const [companyName, setCompanyName] = useState(page?.company_name || "");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = page
      ? await updatePage(formData)
      : await createPage(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/protected/admin");
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="userId" value={userId} />
      {page && <input type="hidden" name="pageId" value={page.id} />}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">
            Page Slug *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            defaultValue={page?.slug}
            pattern="[a-z0-9-]+"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="trig4xcompany"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This will be the URL: /{page?.slug || "slug"}
          </p>
        </div>

        <div>
          <label htmlFor="company_name" className="block text-sm font-medium mb-2">
            Company Name *
          </label>
          <input
            id="company_name"
            name="company_name"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Acme Corp"
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Page Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={page?.title}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Welcome to Your Custom ABM Experience"
        />
      </div>

      <div>
        <label htmlFor="hero_title" className="block text-sm font-medium mb-2">
          Hero Title
        </label>
        <input
          id="hero_title"
          name="hero_title"
          type="text"
          defaultValue={page?.hero_title}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Transform Your Business with Our Solution"
        />
      </div>

      <div>
        <label htmlFor="hero_subtitle" className="block text-sm font-medium mb-2">
          Hero Subtitle
        </label>
        <textarea
          id="hero_subtitle"
          name="hero_subtitle"
          rows={3}
          defaultValue={page?.hero_subtitle}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="We understand your unique challenges and have tailored this experience specifically for you."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="body_markdown" className="block text-sm font-medium">
            Page Content (Markdown)
          </label>
          {organizationId && (
            <PageContentPanel
              organizationId={organizationId}
              companyName={companyName}
              currentContext={meetingTranscript}
              onContentGenerated={(content) => setBodyMarkdown(content)}
            />
          )}
        </div>
        <textarea
          id="body_markdown"
          name="body_markdown"
          rows={10}
          value={bodyMarkdown}
          onChange={(e) => setBodyMarkdown(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          placeholder="## Your Journey with Us&#10;&#10;Write your page content here using Markdown formatting...&#10;&#10;- **Bold text** for emphasis&#10;- *Italic text* for subtle emphasis&#10;- [Links](https://example.com)&#10;- Lists and more!"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Supports full markdown formatting including headers, lists, links, bold, italic, etc.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="meeting_transcript" className="block text-sm font-medium">
            Meeting Transcript (For AI Agent)
          </label>
          {organizationId && (
            <TranscriptSummaryPanel
              organizationId={organizationId}
              currentTranscript={meetingTranscript}
              onSummaryGenerated={(summary) => setMeetingTranscript(summary)}
            />
          )}
        </div>
        <textarea
          id="meeting_transcript"
          name="meeting_transcript"
          rows={6}
          value={meetingTranscript}
          onChange={(e) => setMeetingTranscript(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
          placeholder="Paste meeting transcript here. This will be used by the AI voice agent to provide personalized responses..."
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            This transcript will be available to the ElevenLabs voice agent for
            context
          </p>
          <span
            className={`text-xs font-mono ${
              meetingTranscript.length > 65000
                ? "text-destructive font-bold"
                : "text-muted-foreground"
            }`}
          >
            {meetingTranscript.length.toLocaleString()} bytes
            {meetingTranscript.length > 65000 && " ⚠️"}
          </span>
        </div>
      </div>

      {/* Email Gate Settings */}
      <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          <input
            id="email_gate_enabled"
            name="email_gate_enabled"
            type="checkbox"
            checked={emailGateEnabled}
            onChange={(e) => setEmailGateEnabled(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="email_gate_enabled" className="text-sm font-medium">
            Require email to view page
          </label>
        </div>

        {emailGateEnabled && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Restriction Type
              </label>
              <select
                name="email_gate_type"
                value={emailGateType}
                onChange={(e) => setEmailGateType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="any">Any email address</option>
                <option value="domain">Specific domain only</option>
                <option value="allowlist">Specific email addresses</option>
              </select>
            </div>

            {emailGateType === "domain" && (
              <div>
                <label htmlFor="email_gate_domain" className="block text-sm font-medium mb-2">
                  Required Email Domain
                </label>
                <input
                  id="email_gate_domain"
                  name="email_gate_domain"
                  type="text"
                  defaultValue={page?.email_gate_domain}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="company.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Only users with emails from this domain can access the page
                </p>
              </div>
            )}

            {emailGateType === "allowlist" && (
              <div>
                <label htmlFor="email_gate_allowlist" className="block text-sm font-medium mb-2">
                  Allowed Email Addresses
                </label>
                <textarea
                  id="email_gate_allowlist"
                  name="email_gate_allowlist"
                  rows={4}
                  value={emailAllowlist}
                  onChange={(e) => setEmailAllowlist(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  placeholder={"john@company.com\njane@company.com\nteam@company.com"}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter one email address per line. Only these emails can access the page.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          defaultChecked={page?.is_published || false}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="is_published" className="text-sm font-medium">
          Publish page immediately
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
        >
          {loading ? "Saving..." : page ? "Update Page" : "Create Page"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}