"use client";

import { useEffect, useState } from "react";

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
import { Label } from "@/components/ui/label";
import type { CollectionsListDTO } from "@/lib/collection-types";

export function CreateCollectionDialog({
  open,
  onOpenChange,
  noteIds,
  suggestedName,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteIds: string[];
  suggestedName: string;
  onCreated: (data: CollectionsListDTO & { selectCollectionId?: string }) => void;
}) {
  const [name, setName] = useState(suggestedName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(suggestedName);
      setError(null);
    }
  }, [open, suggestedName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the collection a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, noteIds }),
      });
      const data = (await res.json().catch(() => ({}))) as CollectionsListDTO & {
        error?: string;
        collection?: { id: string };
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create collection");
      }
      onCreated({
        collections: data.collections,
        suggestedCollectionName: data.suggestedCollectionName,
        selectCollectionId: data.collection?.id,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create collection");
    } finally {
      setBusy(false);
    }
  }

  const count = noteIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60 bg-card/95 p-6 shadow-brand backdrop-blur-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create collection</DialogTitle>
          <DialogDescription>
            {count > 0
              ? `Group ${count} note${count === 1 ? "" : "s"} together under one name.`
              : "Start an empty collection and add notes later."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection 1"
              autoComplete="off"
              disabled={busy}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter className="mx-0 mb-0 mt-2 gap-2 border-0 bg-transparent p-0 pb-1 pr-1 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
