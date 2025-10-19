"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPrompt, updatePrompt } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  prompt_type: string;
  system_prompt: string | null;
  user_prompt_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  is_active: boolean;
}

interface PromptFormProps {
  organizationId: string;
  prompt?: Prompt;
}

export function PromptForm({ organizationId, prompt }: PromptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = prompt
      ? await updatePrompt(formData)
      : await createPrompt(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="organizationId" value={organizationId} />
      {prompt && <input type="hidden" name="promptId" value={prompt.id} />}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Prompt Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={prompt?.name}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Quick Summary"
          />
        </div>

        <div>
          <label
            htmlFor="prompt_type"
            className="block text-sm font-medium mb-2"
          >
            Prompt Type *
          </label>
          <select
            id="prompt_type"
            name="prompt_type"
            required
            defaultValue={prompt?.prompt_type || "transcript_condense"}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="meeting_summary">Meeting Summary</option>
            <option value="transcript_condense">Transcript Condense</option>
            <option value="page_content">Page Content Generation</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          defaultValue={prompt?.description || ""}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Brief description of what this prompt does"
        />
      </div>

      <div>
        <label
          htmlFor="system_prompt"
          className="block text-sm font-medium mb-2"
        >
          System Prompt
        </label>
        <Textarea
          id="system_prompt"
          name="system_prompt"
          rows={4}
          defaultValue={prompt?.system_prompt || ""}
          className="font-mono text-sm"
          placeholder="You are an expert at..."
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Sets the AI&apos;s role and behavior
        </p>
      </div>

      <div>
        <label
          htmlFor="user_prompt_template"
          className="block text-sm font-medium mb-2"
        >
          User Prompt Template *
        </label>
        <Textarea
          id="user_prompt_template"
          name="user_prompt_template"
          rows={8}
          required
          defaultValue={prompt?.user_prompt_template}
          className="font-mono text-sm"
          placeholder="Please condense the following transcript...&#10;&#10;{{transcript}}"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Use {`{{transcript}}`} as a placeholder for the transcript text
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="model" className="block text-sm font-medium mb-2">
            Model *
          </label>
          <select
            id="model"
            name="model"
            required
            defaultValue={prompt?.model || "claude-sonnet-4-5-20250929"}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="claude-sonnet-4-5-20250929">
              Claude Sonnet 4.5 (Latest)
            </option>
            <option value="claude-3-5-sonnet-20241022">
              Claude 3.5 Sonnet
            </option>
            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
            <option value="claude-3-haiku-20240307">
              Claude 3 Haiku (Fast)
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="temperature"
            className="block text-sm font-medium mb-2"
          >
            Temperature *
          </label>
          <input
            id="temperature"
            name="temperature"
            type="number"
            step="0.1"
            min="0"
            max="1"
            required
            defaultValue={prompt?.temperature || 0.3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            0 = focused, 1 = creative
          </p>
        </div>

        <div>
          <label
            htmlFor="max_tokens"
            className="block text-sm font-medium mb-2"
          >
            Max Tokens *
          </label>
          <input
            id="max_tokens"
            name="max_tokens"
            type="number"
            step="100"
            min="100"
            max="8000"
            required
            defaultValue={prompt?.max_tokens || 4000}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <input
            id="is_default"
            name="is_default"
            type="checkbox"
            defaultChecked={prompt?.is_default}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="is_default" className="text-sm font-medium">
            Set as default prompt for this type
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={prompt?.is_active ?? true}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="is_active" className="text-sm font-medium">
            Active
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? "Saving..." : prompt ? "Update Prompt" : "Create Prompt"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/protected/admin/prompts")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
