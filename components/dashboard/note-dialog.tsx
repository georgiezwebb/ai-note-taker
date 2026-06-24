"use client";

import { useEffect, useState } from "react";
import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OpenAiEnhanceErrorCode, OpenAiKeyStatusDTO } from "@/lib/openai-key-types";
import type { CollectionDTO } from "@/lib/collection-types";
import type { NoteDTO } from "@/lib/note-types";
import { NoteCollectionPicker } from "@/components/dashboard/note-collection-picker";
import { cn } from "@/lib/utils";

type Mode = "create" | "edit";

const KEY_ERROR_CODES: OpenAiEnhanceErrorCode[] = [
  "missing_key",
  "invalid_key",
  "quota",
];

function EnhanceWithAiField({
  enhanceWithAi,
  onToggle,
  submitting,
  openAiStatus,
  onRequestOpenAiKey,
}: {
  enhanceWithAi: boolean;
  onToggle: (checked: boolean) => void;
  submitting: boolean;
  openAiStatus: OpenAiKeyStatusDTO | null;
  onRequestOpenAiKey: (reason?: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
        <input
          type="checkbox"
          checked={enhanceWithAi}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={submitting}
          className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
        />
        <span className="text-left leading-snug">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <SparklesIcon aria-hidden className="size-3.5 text-primary" />
            Enhance with AI
          </span>
          <span className="mt-0.5 block text-muted-foreground">
            Polishes title and body before saving (uses your OpenAI key).
          </span>
        </span>
      </label>
      {openAiStatus && !openAiStatus.aiAvailable ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto justify-start px-0 text-xs"
          onClick={() =>
            onRequestOpenAiKey(
              "Add your OpenAI API key to use AI enhancement."
            )
          }
        >
          Add OpenAI API key
        </Button>
      ) : openAiStatus?.hasUserKey && openAiStatus.keys[0] ? (
        <p className="text-xs text-muted-foreground">
          Using {openAiStatus.keys[0].name} ({openAiStatus.keys[0].keyHint})
        </p>
      ) : null}
    </div>
  );
}

export function NoteDialog({
  open,
  onOpenChange,
  mode,
  note,
  onSaved,
  openAiStatus,
  onRequestOpenAiKey,
  enhanceAfterKeySave,
  onEnhanceAfterKeyConsumed,
  collections,
  defaultCollectionIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  note: NoteDTO | null;
  onSaved: () => void | Promise<void>;
  openAiStatus: OpenAiKeyStatusDTO | null;
  onRequestOpenAiKey: (reason?: string) => void;
  enhanceAfterKeySave?: boolean;
  onEnhanceAfterKeyConsumed?: () => void;
  collections: CollectionDTO[];
  defaultCollectionIds?: string[];
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhanceWithAi, setEnhanceWithAi] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    setEnhanceWithAi(false);
    if (mode === "edit" && note) {
      setTitle(note.title);
      setContent(note.content);
      setCollectionIds(note.collectionIds);
    } else {
      setTitle("");
      setContent("");
      setCollectionIds(defaultCollectionIds ?? []);
    }
  }, [open, mode, note, defaultCollectionIds]);

  useEffect(() => {
    if (enhanceAfterKeySave && openAiStatus?.aiAvailable) {
      setEnhanceWithAi(true);
      onEnhanceAfterKeyConsumed?.();
    }
  }, [
    enhanceAfterKeySave,
    openAiStatus?.aiAvailable,
    onEnhanceAfterKeyConsumed,
  ]);

  function handleEnhanceToggle(checked: boolean) {
    if (checked && openAiStatus && !openAiStatus.aiAvailable) {
      onRequestOpenAiKey(
        "Add your OpenAI API key to polish notes with AI before saving."
      );
      return;
    }
    setEnhanceWithAi(checked);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Add a title.");
      return;
    }

    if (enhanceWithAi && openAiStatus && !openAiStatus.aiAvailable) {
      onRequestOpenAiKey(
        "Add your OpenAI API key to polish notes with AI before saving."
      );
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmed,
            content,
            enhanceWithAi: enhanceWithAi || undefined,
            collectionIds,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: OpenAiEnhanceErrorCode;
        };
        if (!res.ok) {
          if (data.code && KEY_ERROR_CODES.includes(data.code)) {
            onRequestOpenAiKey(data.error);
          }
          throw new Error(data.error ?? "Could not create note");
        }
      } else if (note) {
        const res = await fetch(`/api/notes/${note.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed, content, collectionIds }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: OpenAiEnhanceErrorCode;
        };
        if (!res.ok) {
          if (data.code && KEY_ERROR_CODES.includes(data.code)) {
            onRequestOpenAiKey(data.error);
          }
          throw new Error(data.error ?? "Could not update note");
        }
      }
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const saveLabel =
    submitting
      ? mode === "create" && enhanceWithAi
        ? "Enhancing…"
        : "Saving…"
      : mode === "create"
        ? "Create"
        : "Save";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="sheet"
        className={cn(
          "gap-0 overflow-hidden border-border/60 bg-card/95 p-0 shadow-brand backdrop-blur-md",
          "sm:max-w-md mobile-landscape:max-w-none"
        )}
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden mobile-landscape:hidden"
          aria-hidden
        />

        <div className="shrink-0 px-4 py-4 mobile-landscape:px-3 mobile-landscape:py-2 sm:px-6 sm:py-5">
          <DialogHeader className="gap-2 text-left mobile-landscape:gap-1">
            <DialogTitle className="mobile-landscape:text-base">
              {mode === "create" ? "New note" : "Edit note"}
            </DialogTitle>
            <DialogDescription className="mobile-landscape:hidden">
              {mode === "create"
                ? "Give it a title and capture your thoughts."
                : "Update the title or body and save when you are done."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 mobile-landscape:px-3 sm:px-6">
            <div className="grid min-w-0 gap-4 pb-4 mobile-landscape:gap-3 mobile-landscape:pb-2">
              <div className="grid min-w-0 gap-2 mobile-landscape:gap-1">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Meeting recap, idea, task…"
                  autoComplete="off"
                  disabled={submitting}
                  className="mobile-landscape:h-9"
                />
              </div>
              <div className="grid min-w-0 gap-2 mobile-landscape:gap-1">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write freely…"
                  rows={6}
                  disabled={submitting}
                  className="max-w-full min-h-[140px] min-w-0 resize-y mobile-landscape:min-h-[5rem] mobile-landscape:max-h-[38dvh] mobile-landscape:overflow-y-auto"
                />
              </div>
              {mode === "create" ? (
                <EnhanceWithAiField
                  enhanceWithAi={enhanceWithAi}
                  onToggle={handleEnhanceToggle}
                  submitting={submitting}
                  openAiStatus={openAiStatus}
                  onRequestOpenAiKey={onRequestOpenAiKey}
                />
              ) : null}
              {collections.length > 0 ? (
                <NoteCollectionPicker
                  collectionIds={collectionIds}
                  collections={collections}
                  onChange={setCollectionIds}
                  disabled={submitting}
                />
              ) : null}
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 space-y-2 border-t border-border/50 bg-muted/30 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] mobile-landscape:px-3 mobile-landscape:py-2 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 min-w-0 mobile-landscape:h-9 sm:h-9"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 min-w-0 mobile-landscape:h-9 sm:h-9"
                disabled={submitting}
              >
                {saveLabel}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
