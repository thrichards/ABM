"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import {
  generateCallSummary,
  getCallGenerations,
} from "@/app/protected/admin/pages/[id]/calls/actions";

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  user_prompt_template: string;
  prompt_type: string;
}

interface Generation {
  id: string;
  output_text: string | null;
  created_at: string;
  tokens_used: number | null;
  status: string;
}

interface AISummaryPanelProps {
  callLogId: string;
  organizationId: string;
  availablePrompts: Prompt[];
}

export function AISummaryPanel({
  callLogId,
  availablePrompts,
}: AISummaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedPromptId, setSelectedPromptId] = useState<string>("default");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [previousGenerations, setPreviousGenerations] = useState<Generation[]>(
    [],
  );

  // Load previous generations when panel opens
  useEffect(() => {
    if (isOpen && previousGenerations.length === 0) {
      getCallGenerations(callLogId)
        .then((generations) => {
          setPreviousGenerations(generations);
        })
        .catch((err) => {
          console.error("Failed to load previous generations:", err);
        });
    }
  }, [isOpen, callLogId, previousGenerations.length]);

  // Get selected prompt details
  const selectedPrompt = availablePrompts.find(
    (p) => p.id === selectedPromptId,
  );

  const handleGenerate = () => {
    setError("");
    setGeneratedSummary("");

    startTransition(async () => {
      try {
        const result = await generateCallSummary(
          callLogId,
          useCustomPrompt ? undefined : selectedPromptId,
          useCustomPrompt ? customPrompt : undefined,
        );

        if (result.success && result.summary) {
          setGeneratedSummary(result.summary);
          setTokensUsed(result.tokensUsed || 0);
          // Reload previous generations to include this new one
          getCallGenerations(callLogId).then(setPreviousGenerations);
        } else {
          setError(result.error || "Failed to generate summary");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const promptTemplate =
    useCustomPrompt || !selectedPrompt
      ? customPrompt
      : selectedPrompt.user_prompt_template;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-purple-500/20"
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          Generate AI Summary
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Meeting Summary
          </SheetTitle>
          <SheetDescription>
            Generate a detailed summary of this call transcript using AI
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Prompt Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Prompt Template</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseCustomPrompt(!useCustomPrompt)}
              >
                {useCustomPrompt ? "Use Saved Prompt" : "Use Custom Prompt"}
              </Button>
            </div>

            {!useCustomPrompt ? (
              <>
                <Select
                  value={selectedPromptId}
                  onValueChange={setSelectedPromptId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{prompt.name}</span>
                          {prompt.description && (
                            <span className="text-xs text-muted-foreground">
                              {prompt.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPrompt?.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedPrompt.description}
                  </p>
                )}
              </>
            ) : null}

            {/* Prompt Preview/Editor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {useCustomPrompt ? "Custom Prompt" : "Prompt Preview"}
              </label>
              <Textarea
                value={promptTemplate}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={!useCustomPrompt}
                placeholder="Enter your custom prompt here..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use {`{{transcript}}`} as a placeholder for the transcript text
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={
              isPending || (useCustomPrompt && !customPrompt.trim())
            }
            className="w-full gap-2"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Output Display */}
          {generatedSummary && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Generated Summary</label>
                <div className="flex items-center gap-2">
                  {tokensUsed > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {tokensUsed.toLocaleString()} tokens
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-secondary/20 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {generatedSummary}
                </div>
              </div>
            </div>
          )}

          {/* Previous Generations */}
          {previousGenerations.length > 0 && (
            <div className="space-y-3 pt-6 border-t">
              <label className="text-sm font-medium">Previous Summaries</label>
              <div className="space-y-2">
                {previousGenerations.slice(0, 3).map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => setGeneratedSummary(gen.output_text || "")}
                    className="w-full text-left p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(gen.created_at).toLocaleString()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          gen.status === "completed"
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {gen.status}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {gen.output_text?.substring(0, 100)}...
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
