"use client";

import { ChevronRight, FolderIcon } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CollectionDTO } from "@/lib/collection-types";
import { cn } from "@/lib/utils";

function formatUpdated(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

export function CollectionCard({
  collection,
  onOpen,
  active = false,
  className,
}: {
  collection: CollectionDTO;
  onOpen: (collection: CollectionDTO) => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "h-full cursor-pointer border-border/60 bg-card/95 shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-brand",
        active && "border-primary/40 ring-2 ring-primary/20",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(collection)}
        className="flex h-full min-h-[7.5rem] w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Open ${collection.name}`}
      >
        <CardHeader className="w-full shrink-0 pb-0">
          <CardTitle className="min-h-[2.625rem] w-full min-w-0">
            <span className="block line-clamp-2 w-full">{collection.name}</span>
          </CardTitle>
          <CardAction aria-hidden>
            <FolderIcon className="size-4 shrink-0 text-primary" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex w-full flex-1 flex-col justify-end pt-2">
          <p className="w-full text-xs text-muted-foreground">
            {collection.noteCount === 0
              ? "No notes yet"
              : `${collection.noteCount} note${collection.noteCount === 1 ? "" : "s"}`}
          </p>
        </CardContent>
        <CardFooter className="mt-auto w-full justify-between gap-2 border-border/50 py-2.5 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">Updated {formatUpdated(collection.updatedAt)}</span>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-primary" />
        </CardFooter>
      </button>
    </Card>
  );
}
