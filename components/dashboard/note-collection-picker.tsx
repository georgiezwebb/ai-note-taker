"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { CollectionDTO } from "@/lib/collection-types";
import { cn } from "@/lib/utils";

export function NoteCollectionPicker({
  collectionIds,
  collections,
  onChange,
  disabled = false,
  label = "Collections",
}: {
  collectionIds: string[];
  collections: CollectionDTO[];
  onChange: (collectionIds: string[]) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (collections.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No collections yet. Create one from the sidebar or date filter.
      </p>
    );
  }

  function toggle(collectionId: string) {
    if (collectionIds.includes(collectionId)) {
      onChange(collectionIds.filter((id) => id !== collectionId));
      return;
    }
    onChange([...collectionIds, collectionId]);
  }

  const selectedCount = collectionIds.length;

  return (
    <div className="grid gap-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="note-collections-list"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md py-1 text-left text-xs font-medium text-foreground outline-none transition-colors",
          "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="min-w-0 flex-1">{label}</span>
        {selectedCount > 0 ? (
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {selectedCount}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        id="note-collections-list"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="grid gap-1.5 pt-2">
            {collections.map((collection) => {
              const checked = collectionIds.includes(collection.id);
              return (
                <li key={collection.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors",
                      checked
                        ? "border-primary/30 bg-primary/10"
                        : "border-border/60 bg-muted/20 hover:bg-muted/40",
                      disabled && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(collection.id)}
                      className="size-3.5 shrink-0 rounded border-input accent-primary"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {collection.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {collection.noteCount}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
