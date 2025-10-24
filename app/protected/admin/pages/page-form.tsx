"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPage, updatePage } from "./actions";
import { TranscriptSummaryPanel } from "@/components/transcript-summary-panel";
import { PageContentPanel } from "@/components/page-content-panel";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

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
    <form action={handleSubmit} className="flex flex-col h-[calc(100vh-12rem)]">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="userId" value={userId} />
      {page && <input type="hidden" name="pageId" value={page.id} />}
      <input type="hidden" name="body_markdown" value={bodyMarkdown} />
      <input type="hidden" name="meeting_transcript" value={meetingTranscript} />
      <input type="hidden" name="email_gate_allowlist" value={emailAllowlist} />

      {/* Top Bar - Basic Info and Actions */}
      <div className="flex items-start gap-4 mb-4 pb-4 border-b">
        <div className="flex-1 grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="slug" className="block text-xs font-medium mb-1 text-muted-foreground">
              Page Slug *
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              defaultValue={page?.slug}
              pattern="[a-z0-9-]+"
              className="w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="company-name"
            />
          </div>

          <div>
            <label htmlFor="company_name" className="block text-xs font-medium mb-1 text-muted-foreground">
              Company Name *
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-xs font-medium mb-1 text-muted-foreground">
              Page Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={page?.title}
              className="w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Custom ABM Page"
            />
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader className="px-6">
                <SheetTitle>Page Settings</SheetTitle>
                <SheetDescription>
                  Configure advanced settings for this page
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6 px-6">
                {/* Hero Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Hero Section</h3>
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
                      placeholder="Transform Your Business"
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
                      placeholder="A personalized experience tailored for you."
                    />
                  </div>
                </div>

                {/* Meeting Transcript */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Meeting Transcript</h3>
                    {organizationId && (
                      <TranscriptSummaryPanel
                        organizationId={organizationId}
                        currentTranscript={meetingTranscript}
                        onSummaryGenerated={(summary) => setMeetingTranscript(summary)}
                      />
                    )}
                  </div>
                  <textarea
                    value={meetingTranscript}
                    onChange={(e) => setMeetingTranscript(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    placeholder="Paste meeting transcript here for AI voice agent context..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Used by the ElevenLabs voice agent
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
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Email Verification</h3>
                  <div className="border rounded-lg p-4 space-y-4">
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
                              Only users with emails from this domain can access
                            </p>
                          </div>
                        )}

                        {emailGateType === "allowlist" && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Allowed Email Addresses
                            </label>
                            <textarea
                              value={emailAllowlist}
                              onChange={(e) => setEmailAllowlist(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                              placeholder={"john@company.com\njane@company.com"}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              One email per line
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Publishing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Publishing</h3>
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
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Saving..." : "Save"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Main Content Area - WYSIWYG Editor */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Page Content</span>
          {organizationId && (
            <PageContentPanel
              organizationId={organizationId}
              companyName={companyName}
              currentContext={meetingTranscript}
              onContentGenerated={(content) => setBodyMarkdown(content)}
            />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <MDEditor
            value={bodyMarkdown}
            onChange={(value) => setBodyMarkdown(value || "")}
            height="100%"
            preview="live"
            hideToolbar={false}
            enableScroll={true}
            visibleDragbar={false}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}
    </form>
  );
}