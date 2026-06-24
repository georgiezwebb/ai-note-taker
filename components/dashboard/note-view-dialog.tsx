"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DownloadIcon,
  PinIcon,
  PinOffIcon,
  PencilIcon,
  SparklesIcon,
  TrashIcon,
  WandSparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { OpenAiEnhanceErrorCode, OpenAiKeyStatusDTO } from "@/lib/openai-key-types";
import type { CollectionDTO } from "@/lib/collection-types";
import type { NoteDTO } from "@/lib/note-types";
import {
  exportNoteAsJpeg,
  exportNoteAsMarkdown,
  exportNoteAsText,
  type NoteExportOptions,
} from "@/lib/note-export";
import { NoteCollectionPicker } from "@/components/dashboard/note-collection-picker";
import { NoteShareMenu } from "@/components/dashboard/note-share-menu";
import { combineOriginalAndPolished } from "@/lib/note-polish-combine";
import { cn } from "@/lib/utils";

type PolishPreview = {
  original: { title: string; content: string };
  polished: { title: string; content: string };
};

const KEY_ERROR_CODES: OpenAiEnhanceErrorCode[] = [
  "missing_key",
  "invalid_key",
  "quota",
];

function formatStamp(iso: string, short = false) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    ...(short ? {} : { timeStyle: "short" }),
  }).format(new Date(iso));
}

export function NoteViewDialog({
  open,
  onOpenChange,
  note,
  openAiStatus,
  onRequestOpenAiKey,
  summarizeAfterKeySave,
  onSummarizeAfterKeyConsumed,
  polishAfterKeySave,
  onPolishAfterKeyConsumed,
  onNoteUpdated,
  onEdit,
  onDelete,
  onTogglePin,
  collections,
  onCollectionsChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteDTO | null;
  openAiStatus: OpenAiKeyStatusDTO | null;
  onRequestOpenAiKey: (
    reason?: string,
    pendingAction?: "summarize" | "polish"
  ) => void;
  summarizeAfterKeySave?: boolean;
  onSummarizeAfterKeyConsumed?: () => void;
  polishAfterKeySave?: boolean;
  onPolishAfterKeyConsumed?: () => void;
  onNoteUpdated?: (note: NoteDTO) => void;
  onEdit: (note: NoteDTO) => void;
  onDelete: (note: NoteDTO) => void;
  onTogglePin?: (note: NoteDTO) => void;
  collections: CollectionDTO[];
  onCollectionsChange: (noteId: string, collectionIds: string[]) => Promise<void>;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishPreview, setPolishPreview] = useState<PolishPreview | null>(null);
  const [applyingPolish, setApplyingPolish] = useState(false);
  const [collectionsBusy, setCollectionsBusy] = useState(false);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setSummary(null);
      setError(null);
      setSummarizing(false);
      setPolishing(false);
      setPolishPreview(null);
      setApplyingPolish(false);
      setExportOpen(false);
      setExportBusy(false);
    }
  }, [open, note?.id]);

  useEffect(() => {
    if (note) {
      setCollectionIds(note.collectionIds);
    }
  }, [note]);

  const runSummarize = useCallback(async () => {
    if (!note) {
      return;
    }
    if (openAiStatus && !openAiStatus.aiAvailable) {
      onRequestOpenAiKey(
        "Add your OpenAI API key to summarise notes with AI.",
        "summarize"
      );
      return;
    }

    setSummarizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${note.id}/summarize`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        summary?: string;
        error?: string;
        code?: OpenAiEnhanceErrorCode;
      };
      if (!res.ok) {
        if (data.code && KEY_ERROR_CODES.includes(data.code)) {
          onRequestOpenAiKey(data.error, "summarize");
        }
        throw new Error(data.error ?? "Could not summarise note");
      }
      setSummary(data.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not summarise note");
    } finally {
      setSummarizing(false);
    }
  }, [note, openAiStatus, onRequestOpenAiKey]);

  const runPolish = useCallback(async () => {
    if (!note) {
      return;
    }
    if (openAiStatus && !openAiStatus.aiAvailable) {
      onRequestOpenAiKey(
        "Add your OpenAI API key to polish notes with AI.",
        "polish"
      );
      return;
    }

    setPolishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${note.id}/polish`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        polished?: { title: string; content: string };
        original?: { title: string; content: string };
        error?: string;
        code?: OpenAiEnhanceErrorCode;
      };
      if (!res.ok) {
        if (data.code && KEY_ERROR_CODES.includes(data.code)) {
          onRequestOpenAiKey(data.error, "polish");
        }
        throw new Error(data.error ?? "Could not polish note");
      }
      if (data.polished && data.original) {
        setPolishPreview({
          original: data.original,
          polished: data.polished,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not polish note");
    } finally {
      setPolishing(false);
    }
  }, [note, openAiStatus, onRequestOpenAiKey]);

  const applyPolishChoice = useCallback(
    async (choice: "polished" | "both") => {
      if (!note || !polishPreview) {
        return;
      }

      const next =
        choice === "polished"
          ? polishPreview.polished
          : combineOriginalAndPolished(
              polishPreview.original,
              polishPreview.polished
            );

      setApplyingPolish(true);
      setError(null);
      try {
        const res = await fetch(`/api/notes/${note.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: next.title,
            content: next.content,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          note?: NoteDTO;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Could not save note");
        }
        if (data.note) {
          onNoteUpdated?.(data.note);
          setSummary(null);
        }
        setPolishPreview(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save note");
      } finally {
        setApplyingPolish(false);
      }
    },
    [note, polishPreview, onNoteUpdated]
  );

  async function handleCollectionsChange(nextIds: string[]) {
    if (!note) {
      return;
    }
    setCollectionIds(nextIds);
    setCollectionsBusy(true);
    setError(null);
    try {
      await onCollectionsChange(note.id, nextIds);
    } catch (err) {
      setCollectionIds(note.collectionIds);
      setError(err instanceof Error ? err.message : "Could not update collections");
    } finally {
      setCollectionsBusy(false);
    }
  }

  useEffect(() => {
    if (summarizeAfterKeySave && openAiStatus?.aiAvailable && open && note) {
      void runSummarize();
      onSummarizeAfterKeyConsumed?.();
    }
  }, [
    summarizeAfterKeySave,
    openAiStatus?.aiAvailable,
    open,
    note,
    runSummarize,
    onSummarizeAfterKeyConsumed,
  ]);

  useEffect(() => {
    if (polishAfterKeySave && openAiStatus?.aiAvailable && open && note) {
      void runPolish();
      onPolishAfterKeyConsumed?.();
    }
  }, [
    polishAfterKeySave,
    openAiStatus?.aiAvailable,
    open,
    note,
    runPolish,
    onPolishAfterKeyConsumed,
  ]);

  if (!note) {
    return null;
  }

  const activeNote = note;
  const trimmed = activeNote.content.trim();
  const isEmptyBody = trimmed.length === 0;
  const exportOptions: NoteExportOptions = { summary };
  const aiBusy = summarizing || polishing || applyingPolish;

  function handleExportText() {
    exportNoteAsText(activeNote, exportOptions);
    setExportOpen(false);
  }

  function handleExportMarkdown() {
    exportNoteAsMarkdown(activeNote, exportOptions);
    setExportOpen(false);
  }

  async function handleExportJpeg() {
    setExportBusy(true);
    setError(null);
    try {
      await exportNoteAsJpeg(activeNote, exportOptions);
      setExportOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export JPEG");
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="sheet"
        className={cn(
          "gap-0 border-border/60 bg-card p-0 shadow-brand ring-0",
          "sm:max-h-[min(90dvh,48rem)] sm:max-w-2xl"
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden />

        <div className="flex shrink-0 flex-col gap-2 border-b border-border/50 px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader className="gap-2 text-left">
            <div className="flex items-start justify-between gap-3 pr-8">
              <DialogTitle className="min-w-0 flex-1 text-lg leading-snug font-semibold sm:text-xl">
                {note.title}
              </DialogTitle>
              {note.pinned ? (
                <PinIcon
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 fill-primary text-primary"
                />
              ) : null}
            </div>
            <DialogDescription className="text-left text-xs leading-relaxed sm:text-sm">
              <span className="sm:hidden">
                Created {formatStamp(note.createdAt, true)}
                {note.updatedAt !== note.createdAt
                  ? ` · Updated ${formatStamp(note.updatedAt, true)}`
                  : null}
              </span>
              <span className="hidden sm:inline">
                Created {formatStamp(note.createdAt)}
                {note.updatedAt !== note.createdAt ? (
                  <>
                    {" · "}
                    Updated {formatStamp(note.updatedAt)}
                  </>
                ) : null}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5">
          <div className="prose-note whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
            {isEmptyBody ? (
              <p className="text-muted-foreground italic">No content yet.</p>
            ) : (
              trimmed
            )}
          </div>

          {summary ? (
            <>
              <Separator className="my-5" />
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <SparklesIcon aria-hidden className="size-3.5" />
                  AI summary
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {summary}
                </p>
              </div>
            </>
          ) : null}

          {polishPreview ? (
            <>
              <Separator className="my-5" />
              <div className="rounded-lg border border-chart-2/25 bg-chart-2/5 px-4 py-3">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-chart-2">
                  <WandSparklesIcon aria-hidden className="size-3.5" />
                  AI polish preview
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0 rounded-md border border-border/60 bg-background/80 px-3 py-2.5">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Original
                    </p>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {polishPreview.original.title}
                    </p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
                      {polishPreview.original.content.trim() || (
                        <span className="italic">No content</span>
                      )}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-md border border-chart-2/30 bg-background/80 px-3 py-2.5">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-chart-2">
                      Polished
                    </p>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {polishPreview.polished.title}
                    </p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
                      {polishPreview.polished.content.trim() || (
                        <span className="italic text-muted-foreground">No content</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 min-w-0 text-xs sm:text-sm"
                    disabled={applyingPolish}
                    onClick={() => void applyPolishChoice("polished")}
                  >
                    {applyingPolish ? "Saving…" : "Use polished"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 min-w-0 text-xs sm:text-sm"
                    disabled={applyingPolish}
                    onClick={() => setPolishPreview(null)}
                  >
                    Keep original
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 min-w-0 text-xs sm:text-sm"
                    disabled={applyingPolish}
                    onClick={() => void applyPolishChoice("both")}
                  >
                    Keep both
                  </Button>
                </div>
              </div>
            </>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {collections.length > 0 ? (
            <>
              <Separator className="my-4" />
              <NoteCollectionPicker
                collectionIds={collectionIds}
                collections={collections}
                onChange={(ids) => void handleCollectionsChange(ids)}
                disabled={collectionsBusy}
              />
            </>
          ) : null}
        </div>

        <div className="shrink-0 space-y-3 border-t border-border/50 bg-muted/30 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
          <div
            className={cn(
              "grid gap-2",
              onTogglePin ? "grid-cols-3" : "grid-cols-2"
            )}
          >
            {onTogglePin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-11 min-w-0 gap-1.5 px-2 text-xs sm:h-9",
                  note.pinned && "border-primary/40 bg-primary/5"
                )}
                aria-pressed={note.pinned}
                onClick={() => void onTogglePin(note)}
              >
                {note.pinned ? (
                  <PinOffIcon aria-hidden className="size-4 shrink-0" />
                ) : (
                  <PinIcon aria-hidden className="size-4 shrink-0" />
                )}
                <span className="truncate">{note.pinned ? "Unpin" : "Pin"}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 min-w-0 gap-1.5 px-2 text-xs sm:h-9"
              onClick={() => {
                onOpenChange(false);
                onEdit(note);
              }}
            >
              <PencilIcon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">Edit</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-11 min-w-0 gap-1.5 px-2 text-xs sm:h-9"
              onClick={() => {
                onDelete(note);
              }}
            >
              <TrashIcon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">Delete</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-11 min-w-0 gap-1.5 px-2 text-xs sm:h-9 sm:text-sm"
              disabled={aiBusy}
              onClick={() => void runSummarize()}
            >
              <SparklesIcon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">
                {summarizing
                  ? "Summarising…"
                  : summary
                    ? "Summarise again"
                    : "Summarise with AI"}
              </span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-11 min-w-0 gap-1.5 px-2 text-xs sm:h-9 sm:text-sm"
              disabled={aiBusy}
              onClick={() => void runPolish()}
            >
              <WandSparklesIcon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">
                {polishing
                  ? "Polishing…"
                  : polishPreview
                    ? "Polish again"
                    : "Polish with AI"}
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NoteShareMenu
              note={activeNote}
              exportOptions={exportOptions}
              onError={setError}
              triggerClassName="h-11 w-full min-w-0 gap-1.5 px-2 text-xs sm:h-9 sm:text-sm"
            />
            <Popover open={exportOpen} onOpenChange={setExportOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 w-full min-w-0 gap-1.5 px-2 text-xs sm:h-9 sm:text-sm"
                    disabled={exportBusy}
                  />
                }
              >
                <DownloadIcon aria-hidden className="size-4 shrink-0" />
                <span className="truncate">Export</span>
              </PopoverTrigger>
              <PopoverContent align="end" side="top" className="w-44 p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleExportText}
                >
                  Plain text (.txt)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleExportMarkdown}
                >
                  Markdown (.md)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  disabled={exportBusy}
                  onClick={() => void handleExportJpeg()}
                >
                  JPEG image (.jpg)
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
