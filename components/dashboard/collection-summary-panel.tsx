"use client";

import { SparklesIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CollectionDTO } from "@/lib/collection-types";
import { cn } from "@/lib/utils";

export function CollectionSummaryPanel({
  collection,
  summary,
  summarizing,
  error,
  onSummarize,
  onDismiss,
  className,
}: {
  collection: CollectionDTO;
  summary: string | null;
  summarizing: boolean;
  error: string | null;
  onSummarize: () => void;
  onDismiss: () => void;
  className?: string;
}) {
  const canSummarize = collection.noteCount > 0;

  return (
    <div
      className={cn(
        "relative mt-4 rounded-xl border border-border/60 bg-card/40 px-4 py-3 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground">
          Summarise all {collection.noteCount} note
          {collection.noteCount === 1 ? "" : "s"} in this collection with AI.
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1.5 shadow-sm"
          disabled={summarizing || !canSummarize}
          onClick={onSummarize}
        >
          <SparklesIcon aria-hidden className="size-3.5" />
          {summarizing
            ? "Summarising…"
            : summary
              ? "Summarise again"
              : "Summarise collection"}
        </Button>
      </div>

      {!canSummarize ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Add notes to this collection first.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {summary ? (
        <div className="relative mt-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <SparklesIcon aria-hidden className="size-3.5" />
              Collection summary
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss summary"
            >
              <XIcon aria-hidden className="size-3.5" />
            </button>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {summary}
          </p>
        </div>
      ) : null}
    </div>
  );
}
