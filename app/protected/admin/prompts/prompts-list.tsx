"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePrompt } from "./actions";

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  prompt_type: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface PromptsListProps {
  prompts: Prompt[];
  organizationId: string;
  userRole: string;
}

export function PromptsList({
  prompts,
  userRole,
}: PromptsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (promptId: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) {
      return;
    }

    setDeletingId(promptId);
    try {
      await deletePrompt(promptId);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      alert("Failed to delete prompt");
    } finally {
      setDeletingId(null);
    }
  };

  const canEdit = userRole === "admin";

  const promptTypeLabels: Record<string, string> = {
    meeting_summary: "Meeting Summary",
    transcript_condense: "Transcript Condense",
    page_content: "Page Content",
    custom: "Custom",
  };

  if (!prompts || prompts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">
          No prompts found. Create your first prompt template.
        </p>
        {canEdit && (
          <Link href="/protected/admin/prompts/new">
            <Button>Create Prompt</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className={`border rounded-lg p-6 bg-card ${
            !prompt.is_active ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{prompt.name}</h3>
                {prompt.is_default && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                )}
                {!prompt.is_active && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-500/20 text-gray-700 dark:text-gray-400">
                    Inactive
                  </span>
                )}
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-400">
                  {promptTypeLabels[prompt.prompt_type] || prompt.prompt_type}
                </span>
              </div>

              {prompt.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {prompt.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Model: {prompt.model}</span>
                <span>Temperature: {prompt.temperature}</span>
                <span>Max Tokens: {prompt.max_tokens}</span>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <Link href={`/protected/admin/prompts/${prompt.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(prompt.id)}
                  disabled={deletingId === prompt.id}
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === prompt.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
