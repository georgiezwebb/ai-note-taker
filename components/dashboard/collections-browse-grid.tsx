"use client";

import { CollectionCard } from "@/components/dashboard/collection-card";
import type { CollectionDTO } from "@/lib/collection-types";

export function CollectionsBrowseGrid({
  collections,
  selectedCollectionId,
  onOpenCollection,
}: {
  collections: CollectionDTO[];
  selectedCollectionId: string | null;
  onOpenCollection: (collection: CollectionDTO) => void;
}) {
  if (collections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No collections yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create one from the sidebar, or group notes using a date filter.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid min-w-0 auto-rows-fr gap-5 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-1 xl:grid-cols-2">
      {collections.map((collection) => (
        <li key={collection.id} className="min-h-0 h-full">
          <CollectionCard
            collection={collection}
            active={selectedCollectionId === collection.id}
            onOpen={onOpenCollection}
          />
        </li>
      ))}
    </ul>
  );
}
