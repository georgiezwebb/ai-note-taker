"use client";

import { useMemo } from "react";
import * as React from "react";
import { ChevronDown, Pin as PinIcon } from "lucide-react";

import { NoteCard } from "@/components/dashboard/note-card";
import {
  sidebarPanelClassName,
  sidebarPanelPadding,
  sidebarTriggerClassName,
} from "@/components/dashboard/sidebar-panel-styles";
import { Card } from "@/components/ui/card";
import type { NoteDTO } from "@/lib/note-types";
import { cn } from "@/lib/utils";

export function NotesPinnedPanel({
  notes,
  onOpen,
  onEdit,
  onDelete,
  onTogglePin,
  className,
  embedded = false,
}: {
  notes: NoteDTO[];
  onOpen: (note: NoteDTO) => void;
  onEdit: (note: NoteDTO) => void;
  onDelete: (note: NoteDTO) => void;
  onTogglePin: (note: NoteDTO) => void;
  className?: string;
  embedded?: boolean;
}) {
  const pinnedNotes = useMemo(
    () =>
      notes
        .filter((n) => n.pinned)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [notes]
  );

  const [open, setOpen] = React.useState(false);
  const count = pinnedNotes.length;

  return (
    <Card
      className={cn(
        sidebarPanelClassName(className, embedded),
        sidebarPanelPadding(open)
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="notes-pinned-panel"
        onClick={() => setOpen((v) => !v)}
        className={sidebarTriggerClassName()}
      >
        <PinIcon aria-hidden className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">Pinned notes</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        id="notes-pinned-panel"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "max-h-[min(24rem,50vh)] overflow-y-auto pt-3",
              count === 0 && "max-h-none"
            )}
          >
            {count === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
                Pin a note to keep it here for quick access.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pinnedNotes.map((note) => (
                  <li key={note.id} className="min-h-0 h-full">
                    <NoteCard
                      note={note}
                      onOpen={onOpen}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onTogglePin={onTogglePin}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
