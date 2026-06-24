"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CollectionDTO } from "@/lib/collection-types";
import type { NoteDTO } from "@/lib/note-types";
import { cn } from "@/lib/utils";

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

export function AddToCollectionDialog({
  open,
  onOpenChange,
  collection,
  notes,
  onCreateNew,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: CollectionDTO | null;
  notes: NoteDTO[];
  onCreateNew: () => void;
  onAdded: () => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableNotes = useMemo(() => {
    if (!collection) {
      return [];
    }
    const inCollection = new Set(collection.noteIds);
    return notes
      .filter((n) => !inCollection.has(n.id))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [collection, notes]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return availableNotes;
    }
    return availableNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [availableNotes, search]);

  function resetState() {
    setSearch("");
    setSelected([]);
    setError(null);
    setBusy(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetState();
    }
    onOpenChange(next);
  }

  function toggleNote(noteId: string) {
    setSelected((current) =>
      current.includes(noteId)
        ? current.filter((id) => id !== noteId)
        : [...current, noteId]
    );
  }

  function handleCreateNew() {
    handleOpenChange(false);
    onCreateNew();
  }

  async function handleAddExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!collection || selected.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addNoteIds: selected }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not add notes");
      }
      handleOpenChange(false);
      await onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add notes");
    } finally {
      setBusy(false);
    }
  }

  if (!collection) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,36rem)] flex-col gap-0 overflow-hidden border-border/60 bg-card/95 p-0 shadow-brand backdrop-blur-md sm:max-w-md">
        <DialogHeader className="shrink-0 border-b border-border/50 px-6 py-5 text-left">
          <DialogTitle>Add to {collection.name}</DialogTitle>
          <DialogDescription>
            Create a new note or add notes you already have.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="mb-4 w-full justify-start gap-2"
            onClick={handleCreateNew}
            disabled={busy}
          >
            <PlusIcon aria-hidden className="size-4" />
            Create new note
          </Button>

          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground">
              Add existing notes
            </p>
            {selected.length > 0 ? (
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {selected.length} selected
              </span>
            ) : null}
          </div>

          {availableNotes.length > 0 ? (
            <>
              <div className="relative mb-3">
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notes…"
                  className="h-8 pl-8 text-xs"
                  autoComplete="off"
                  disabled={busy}
                />
              </div>
              <ul className="grid max-h-[min(16rem,40vh)] gap-1.5 overflow-y-auto">
                {filteredNotes.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                    No notes match your search.
                  </li>
                ) : (
                  filteredNotes.map((note) => {
                    const checked = selected.includes(note.id);
                    return (
                      <li key={note.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors",
                            checked
                              ? "border-primary/30 bg-primary/10"
                              : "border-border/60 bg-muted/20 hover:bg-muted/40",
                            busy && "cursor-not-allowed opacity-60"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={busy}
                            onChange={() => toggleNote(note.id)}
                            className="mt-0.5 size-3.5 shrink-0 rounded border-input accent-primary"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-foreground">
                              {note.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {formatStamp(note.createdAt)}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
              All your notes are already in this collection.
            </p>
          )}

          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 gap-2 border-t border-border/50 bg-muted/30 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || selected.length === 0}
            onClick={(e) => void handleAddExisting(e)}
          >
            {busy
              ? "Adding…"
              : selected.length > 0
                ? `Add ${selected.length} note${selected.length === 1 ? "" : "s"}`
                : "Add selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
