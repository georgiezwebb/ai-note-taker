"use client";

import * as React from "react";
import { ChevronDown, FolderIcon, PlusIcon } from "lucide-react";

import {
  sidebarPanelClassName,
  sidebarPanelPadding,
  sidebarTriggerClassName,
} from "@/components/dashboard/sidebar-panel-styles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CollectionDTO } from "@/lib/collection-types";
import { cn } from "@/lib/utils";

export function NotesCollectionsPanel({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  showAllCollections,
  onToggleShowAll,
  className,
  embedded = false,
}: {
  collections: CollectionDTO[];
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  onCreateCollection: () => void;
  showAllCollections: boolean;
  onToggleShowAll: () => void;
  className?: string;
  embedded?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const count = collections.length;

  return (
    <Card
      className={cn(
        sidebarPanelClassName(className, embedded),
        sidebarPanelPadding(open)
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="notes-collections-panel"
          onClick={() => setOpen((v) => !v)}
          className={sidebarTriggerClassName()}
        >
          <FolderIcon aria-hidden className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">Collections</span>
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
        {selectedCollectionId ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={() => onSelectCollection(null)}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <div
        id="notes-collections-panel"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-3">
            <div className="mb-2 flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-7 min-w-0 flex-1 gap-1 px-2 text-xs"
                onClick={onCreateCollection}
              >
                <PlusIcon aria-hidden className="size-3 shrink-0" />
                <span className="truncate">New collection</span>
              </Button>
              <Button
                type="button"
                variant={showAllCollections ? "secondary" : "outline"}
                size="xs"
                className="h-7 min-w-0 flex-1 px-2 text-xs"
                aria-pressed={showAllCollections}
                onClick={onToggleShowAll}
              >
                Show all
              </Button>
            </div>
            {count === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
                Group related notes into collections.
              </p>
            ) : (
              <ul className="max-h-[min(16rem,40vh)] space-y-1 overflow-y-auto">
                {collections.map((collection) => {
                  const active = selectedCollectionId === collection.id;
                  return (
                    <li key={collection.id}>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectCollection(
                            active ? null : collection.id
                          )
                        }
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                          active
                            ? "bg-primary/15 font-medium text-primary"
                            : "hover:bg-muted/60 text-foreground"
                        )}
                        aria-pressed={active}
                      >
                        <FolderIcon aria-hidden className="size-3.5 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {collection.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {collection.noteCount}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
