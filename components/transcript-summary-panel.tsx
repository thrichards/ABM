"use client";

import { useState, useTransition } from "react";
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
import { Sparkles, Loader2, Copy, Check, ArrowDown } from "lucide-react";
import {
  generateTranscriptSummary,
  getAvailablePrompts,
} from "@/app/protected/admin/pages/transcript-actions";

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  user_prompt_template: string;
  prompt_type: string;
  is_default?: boolean;
}

interface TranscriptSummaryPanelProps {
  organizationId: string;
  currentTranscript: string;
  onSummaryGenerated: (summary: string) => void;
}

export function TranscriptSummaryPanel({
  organizationId,
  currentTranscript,
  onSummaryGenerated,
}: TranscriptSummaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [compressionStats, setCompressionStats] = useState<{
    original: number;
    condensed: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [promptsLoaded, setPromptsLoaded] = useState(false);

  // Load prompts when panel opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !promptsLoaded) {
      getAvailablePrompts(organizationId)
        .then((prompts) => {
          setAvailablePrompts(prompts);
          setPromptsLoaded(true);
          // Set default to first "transcript_condense" prompt or first prompt
          const defaultPrompt =
            prompts.find((p) => p.prompt_type === "transcript_condense" && p.is_default) ||
            prompts.find((p) => p.prompt_type === "transcript_condense") ||
            prompts[0];
          if (defaultPrompt) {
            setSelectedPromptId(defaultPrompt.id);
          }
        })
        .catch((err) => {
          console.error("Failed to load prompts:", err);
        });
    }
  };

  // Get selected prompt details
  const selectedPrompt = availablePrompts.find(
    (p) => p.id === selectedPromptId,
  );

  const handleGenerate = () => {
    setError("");
    setGeneratedSummary("");
    setCompressionStats(null);

    if (!currentTranscript.trim()) {
      setError("No transcript text to summarize");
      return;
    }

    startTransition(async () => {
      try {
        const result = await generateTranscriptSummary(
          currentTranscript,
          organizationId,
          useCustomPrompt ? undefined : selectedPromptId,
          useCustomPrompt ? customPrompt : undefined,
        );

        if (result.success && result.summary) {
          setGeneratedSummary(result.summary);
          setTokensUsed(result.tokensUsed || 0);
          if (result.originalLength && result.condensedLength) {
            setCompressionStats({
              original: result.originalLength,
              condensed: result.condensedLength,
            });
          }
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

  const handleUseInForm = () => {
    onSummaryGenerated(generatedSummary);
    setIsOpen(false);
  };

  const promptTemplate =
    useCustomPrompt || !selectedPrompt
      ? customPrompt
      : selectedPrompt.user_prompt_template;

  const compressionPercentage = compressionStats
    ? Math.round(
        (1 - compressionStats.condensed / compressionStats.original) * 100,
      )
    : 0;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-purple-500/20"
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          Generate Summary
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-y-auto px-6">
        <SheetHeader className="px-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Transcript Summary
          </SheetTitle>
          <SheetDescription>
            Condense your transcript to fit within the ElevenLabs agent size
            limit (65KB)
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-0">
          {/* Current Transcript Size */}
          <div className="bg-secondary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Size</span>
              <span
                className={`text-sm font-mono ${
                  currentTranscript.length > 65000
                    ? "text-destructive font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {currentTranscript.length.toLocaleString()} bytes
                {currentTranscript.length > 65000 && " ⚠️ TOO LARGE"}
              </span>
            </div>
          </div>

          {/* Prompt Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Prompt Template</label>
              <Button
                type="button"
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
            type="button"
            onClick={handleGenerate}
            disabled={
              isPending || (useCustomPrompt && !customPrompt.trim()) || !currentTranscript.trim()
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
                    type="button"
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

              {compressionStats && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-green-700 dark:text-green-400">
                      Compressed by {compressionPercentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {compressionStats.original.toLocaleString()} →{" "}
                      {compressionStats.condensed.toLocaleString()} bytes
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-secondary/20 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-mono text-xs">
                  {generatedSummary}
                </div>
              </div>

              {/* Use in Form Button */}
              <Button
                type="button"
                onClick={handleUseInForm}
                className="w-full gap-2"
                variant="default"
              >
                <ArrowDown className="w-4 h-4" />
                Use This Summary in Form
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
