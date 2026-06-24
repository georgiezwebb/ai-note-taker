"use client";

import { PinIcon, PinOffIcon, PencilIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NoteDTO } from "@/lib/note-types";
import { cn } from "@/lib/utils";

const LIST_PREVIEW_CHAR_CAP = 8000;

/** Collapse whitespace so line-clamp controls height in the grid. */
function previewForCard(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "No content yet.";
  }
  const collapsed = trimmed.replace(/\s+/g, " ");
  if (collapsed.length > LIST_PREVIEW_CHAR_CAP) {
    return `${collapsed.slice(0, LIST_PREVIEW_CHAR_CAP)}…`;
  }
  return collapsed;
}

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatCardMeta(note: NoteDTO) {
  const created = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(note.createdAt));
  const createdFull = formatStamp(note.createdAt);

  if (note.updatedAt === note.createdAt) {
    return { short: `Created ${created}`, full: `Created ${createdFull}` };
  }

  const updated = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(note.updatedAt));
  const updatedFull = formatStamp(note.updatedAt);

  return {
    short: `Created ${created} · Updated ${updated}`,
    full: `Created ${createdFull} · Updated ${updatedFull}`,
  };
}

export function NoteCard({
  note,
  onOpen,
  onEdit,
  onDelete,
  onTogglePin,
  className,
}: {
  note: NoteDTO;
  onOpen: (note: NoteDTO) => void;
  onEdit: (note: NoteDTO) => void;
  onDelete: (note: NoteDTO) => void;
  onTogglePin?: (note: NoteDTO) => void;
  className?: string;
}) {
  const preview = previewForCard(note.content);
  const isEmptyBody = note.content.trim().length === 0;
  const meta = formatCardMeta(note);

  return (
    <Card
      className={cn(
        "group/card relative flex h-full flex-col gap-0 overflow-hidden border py-0 shadow-sm",
        "bg-card/95 backdrop-blur-md transition-[transform,box-shadow] duration-300",
        "hover:-translate-y-0.5 hover:shadow-brand",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        note.pinned ? "border-primary/35 ring-primary/10" : "border-border/60",
        className
      )}
    >
      <div
        className={cn(
          "h-0.5 shrink-0 bg-gradient-to-r opacity-90",
          note.pinned
            ? "from-primary via-amber-500/90 to-chart-2/80"
            : "from-primary/80 via-chart-2/70 to-chart-3/80"
        )}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => onOpen(note)}
        className="flex w-full min-h-0 flex-1 cursor-pointer flex-col text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <CardHeader className="w-full shrink-0 gap-1 pb-0 pt-4">
          <CardTitle className="min-h-[2.625rem] w-full min-w-0 transition-colors group-hover/card:text-primary">
            <span className="block line-clamp-2 w-full">{note.title}</span>
          </CardTitle>
          {note.pinned ? (
            <CardAction aria-label="Pinned note">
              <PinIcon
                aria-hidden
                className="size-4 fill-primary text-primary"
              />
            </CardAction>
          ) : null}
          <p
            className="col-span-full w-full min-w-0 line-clamp-2 text-xs leading-snug text-muted-foreground sm:line-clamp-1"
            title={meta.full}
          >
            <span className="sm:hidden">{meta.short}</span>
            <span className="hidden sm:inline">{meta.full}</span>
          </p>
        </CardHeader>
        <CardContent className="flex w-full h-[2.625rem] shrink-0 items-start overflow-hidden pb-3 pt-2">
          <p
            className={cn(
              "line-clamp-2 w-full text-sm leading-snug text-pretty text-muted-foreground",
              isEmptyBody && "italic"
            )}
          >
            {preview}
          </p>
        </CardContent>
      </button>
      <CardFooter
        className="mt-auto grid shrink-0 grid-cols-3 gap-2 border-t border-border/50 bg-muted/30 p-2.5 sm:gap-1.5 sm:p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {onTogglePin ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-10 w-full min-w-0 justify-center gap-1 px-2 text-xs sm:h-8 sm:px-1.5 border-primary/20 hover:border-primary/40 hover:bg-accent/60",
              note.pinned && "border-primary/40 bg-primary/5"
            )}
            aria-pressed={note.pinned}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            onClick={() => onTogglePin(note)}
          >
            {note.pinned ? (
              <PinOffIcon aria-hidden className="size-4 shrink-0 sm:size-3.5" />
            ) : (
              <PinIcon aria-hidden className="size-4 shrink-0 sm:size-3.5" />
            )}
            <span className="truncate">{note.pinned ? "Unpin" : "Pin"}</span>
          </Button>
        ) : (
          <span aria-hidden />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-full min-w-0 justify-center gap-1 px-2 text-xs sm:h-8 sm:px-1.5 border-primary/20 hover:border-primary/40 hover:bg-accent/60"
          onClick={() => onEdit(note)}
        >
          <PencilIcon aria-hidden className="size-4 shrink-0 sm:size-3.5" />
          <span className="truncate">Edit</span>
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-10 w-full min-w-0 justify-center gap-1 px-2 text-xs sm:h-8 sm:px-1.5"
          onClick={() => onDelete(note)}
        >
          <TrashIcon aria-hidden className="size-4 shrink-0 sm:size-3.5" />
          <span className="truncate">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
