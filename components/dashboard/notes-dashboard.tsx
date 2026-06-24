"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";

import { NoteCard } from "@/components/dashboard/note-card";
import {
  CalendarFilterShortStatus,
  filterNotesBySelectedDates,
  formatSelectedDatesLongText,
  hasActiveDateFilter,
  NotesCalendarFilter,
} from "@/components/dashboard/notes-calendar-filter";
import { NotesPinnedPanel } from "@/components/dashboard/notes-pinned-panel";
import { NotesCollectionsPanel } from "@/components/dashboard/notes-collections-panel";
import { CollectionsBrowseGrid } from "@/components/dashboard/collections-browse-grid";
import { AddToCollectionDialog } from "@/components/dashboard/add-to-collection-dialog";
import { DashboardAccountButton } from "@/components/dashboard/dashboard-account-button";
import { CollectionSummaryPanel } from "@/components/dashboard/collection-summary-panel";
import { CreateCollectionDialog } from "@/components/dashboard/create-collection-dialog";
import { NoteViewDialog } from "@/components/dashboard/note-view-dialog";
import { NoteDialog } from "@/components/dashboard/note-dialog";
import { OpenAiKeyDialog } from "@/components/settings/openai-key-dialog";
import { OpenAiKeyPanel } from "@/components/settings/openai-key-panel";
import { OpenAiOnboardingDialog } from "@/components/settings/openai-onboarding-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  OpenAiEnhanceErrorCode,
  OpenAiKeyStatusDTO,
} from "@/lib/openai-key-types";
import type { CollectionDTO } from "@/lib/collection-types";
import type { NoteDTO } from "@/lib/note-types";
import { cn } from "@/lib/utils";

const KEY_ERROR_CODES: OpenAiEnhanceErrorCode[] = [
  "missing_key",
  "invalid_key",
  "quota",
];

function filterNotesBySearch(notes: NoteDTO[], query: string): NoteDTO[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return notes;
  }
  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );
}

function sortNotesNewestFirst(notes: NoteDTO[]): NoteDTO[] {
  return [...notes].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function filterNotesByCollection(
  notes: NoteDTO[],
  collectionId: string | null,
  collections: CollectionDTO[]
): NoteDTO[] {
  if (!collectionId) {
    return notes;
  }
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) {
    return notes;
  }
  const ids = new Set(collection.noteIds);
  return notes.filter((n) => ids.has(n.id));
}

export function NotesDashboard({ initialNotes }: { initialNotes: NoteDTO[] }) {
  const [notes, setNotes] = useState<NoteDTO[]>(() =>
    sortNotesNewestFirst(initialNotes)
  );
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<NoteDTO | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [summarizeAfterKeySave, setSummarizeAfterKeySave] = useState(false);
  const [polishAfterKeySave, setPolishAfterKeySave] = useState(false);
  const [openAiStatus, setOpenAiStatus] = useState<OpenAiKeyStatusDTO | null>(
    null
  );
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [keyDialogReason, setKeyDialogReason] = useState<string | undefined>();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [enhanceAfterKeySave, setEnhanceAfterKeySave] = useState(false);
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [suggestedCollectionName, setSuggestedCollectionName] = useState("Collection 1");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [createCollectionNoteIds, setCreateCollectionNoteIds] = useState<string[]>([]);
  const [createDefaultCollectionIds, setCreateDefaultCollectionIds] = useState<string[]>([]);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [collectionSummary, setCollectionSummary] = useState<string | null>(null);
  const [collectionSummarizing, setCollectionSummarizing] = useState(false);
  const [collectionSummaryError, setCollectionSummaryError] = useState<string | null>(
    null
  );
  const [summarizeCollectionAfterKeySave, setSummarizeCollectionAfterKeySave] =
    useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const onboardingPrompted = useRef(false);
  const keySaveSucceeded = useRef(false);

  const refreshOpenAiStatus = useCallback(async () => {
    const res = await fetch("/api/settings/openai");
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { status: OpenAiKeyStatusDTO };
    setOpenAiStatus(data.status);
    return data.status;
  }, []);

  useEffect(() => {
    void refreshOpenAiStatus().then((status) => {
      if (
        status &&
        !onboardingPrompted.current &&
        !status.onboardingDismissed &&
        !status.hasUserKey
      ) {
        onboardingPrompted.current = true;
        setOnboardingOpen(true);
      }
    });
  }, [refreshOpenAiStatus]);

  function requestOpenAiKey(reason?: string) {
    setKeyDialogReason(reason);
    setKeyDialogOpen(true);
  }

  async function dismissOpenAiOnboarding() {
    const res = await fetch("/api/settings/openai/onboarding", {
      method: "POST",
    });
    if (res.ok) {
      const data = (await res.json()) as { status: OpenAiKeyStatusDTO };
      setOpenAiStatus(data.status);
    }
  }

  const notesMatchingSearch = useMemo(
    () => filterNotesBySearch(notes, searchQuery),
    [notes, searchQuery]
  );

  const notesMatchingDates = useMemo(
    () => filterNotesBySelectedDates(notesMatchingSearch, selectedDates),
    [notesMatchingSearch, selectedDates]
  );

  const filteredNotes = useMemo(
    () =>
      filterNotesByCollection(
        notesMatchingDates,
        selectedCollectionId,
        collections
      ),
    [notesMatchingDates, selectedCollectionId, collections]
  );

  const dateFilterActive = hasActiveDateFilter(selectedDates);
  const dateFilterLabel = formatSelectedDatesLongText(selectedDates);
  const selectedCollection = useMemo(
    () => collections.find((c) => c.id === selectedCollectionId) ?? null,
    [collections, selectedCollectionId]
  );

  const notesOrderedForDisplay = useMemo(
    () => sortNotesNewestFirst(filteredNotes),
    [filteredNotes]
  );

  const viewingNote = useMemo(
    () => notes.find((n) => n.id === viewingId) ?? null,
    [notes, viewingId]
  );

  const searchActive = searchQuery.trim().length > 0;

  const pageTitle = showAllCollections
    ? "All collections"
    : selectedCollection
      ? selectedCollection.name
      : "Your notes";

  const refreshCollections = useCallback(async () => {
    const res = await fetch("/api/collections");
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as {
      collections: CollectionDTO[];
      suggestedCollectionName: string;
    };
    setCollections(data.collections);
    setSuggestedCollectionName(data.suggestedCollectionName);
  }, []);

  const refresh = useCallback(async () => {
    const [notesRes, collectionsRes] = await Promise.all([
      fetch("/api/notes"),
      fetch("/api/collections"),
    ]);
    if (notesRes.ok) {
      const data = (await notesRes.json()) as { notes: NoteDTO[] };
      setNotes(sortNotesNewestFirst(data.notes));
    }
    if (collectionsRes.ok) {
      const data = (await collectionsRes.json()) as {
        collections: CollectionDTO[];
        suggestedCollectionName: string;
      };
      setCollections(data.collections);
      setSuggestedCollectionName(data.suggestedCollectionName);
    }
  }, []);

  useEffect(() => {
    void refreshCollections();
  }, [refreshCollections]);

  async function handleNoteCollectionsChange(
    noteId: string,
    collectionIds: string[]
  ) {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionIds }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? "Could not update collections");
    }
    await refresh();
  }

  function openCreateCollection(noteIds: string[]) {
    setCreateCollectionNoteIds(noteIds);
    setCreateCollectionOpen(true);
  }

  function handleCollectionCreated(data: {
    collections: CollectionDTO[];
    suggestedCollectionName: string;
    selectCollectionId?: string;
  }) {
    setCollections(data.collections);
    setSuggestedCollectionName(data.suggestedCollectionName);
    if (data.selectCollectionId) {
      setSelectedCollectionId(data.selectCollectionId);
    }
    void refresh();
  }

  function selectCollection(collectionId: string | null) {
    setSelectedCollectionId(collectionId);
    setShowAllCollections(false);
    setCollectionSummary(null);
    setCollectionSummaryError(null);
  }

  function openCollection(collection: CollectionDTO) {
    selectCollection(collection.id);
  }

  function openCreate() {
    setDialogMode("create");
    setEditing(null);
    setCreateDefaultCollectionIds(
      selectedCollectionId ? [selectedCollectionId] : []
    );
    setDialogOpen(true);
  }

  function openAddToCollection() {
    setAddToCollectionOpen(true);
  }

  function handleAddToCollectionClick() {
    if (selectedCollectionId) {
      openAddToCollection();
      return;
    }
    openCreate();
  }

  const runCollectionSummarize = useCallback(async () => {
    if (!selectedCollectionId || !selectedCollection) {
      return;
    }
    if (openAiStatus && !openAiStatus.aiAvailable) {
      setSummarizeCollectionAfterKeySave(true);
      requestOpenAiKey(
        "Add your OpenAI API key to summarise collections with AI."
      );
      return;
    }

    setCollectionSummarizing(true);
    setCollectionSummaryError(null);
    try {
      const res = await fetch(
        `/api/collections/${selectedCollectionId}/summarize`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        summary?: string;
        error?: string;
        code?: OpenAiEnhanceErrorCode;
      };
      if (!res.ok) {
        if (data.code && KEY_ERROR_CODES.includes(data.code)) {
          setSummarizeCollectionAfterKeySave(true);
          requestOpenAiKey(data.error);
        }
        throw new Error(data.error ?? "Could not summarise collection");
      }
      setCollectionSummary(data.summary ?? null);
    } catch (err) {
      setCollectionSummaryError(
        err instanceof Error ? err.message : "Could not summarise collection"
      );
    } finally {
      setCollectionSummarizing(false);
    }
  }, [selectedCollectionId, selectedCollection, openAiStatus]);

  useEffect(() => {
    if (
      summarizeCollectionAfterKeySave &&
      openAiStatus?.aiAvailable &&
      selectedCollectionId
    ) {
      void runCollectionSummarize();
      setSummarizeCollectionAfterKeySave(false);
    }
  }, [
    summarizeCollectionAfterKeySave,
    openAiStatus?.aiAvailable,
    selectedCollectionId,
    runCollectionSummarize,
  ]);

  function openView(note: NoteDTO) {
    setViewingId(note.id);
    setViewOpen(true);
  }

  function openEdit(note: NoteDTO) {
    setDialogMode("edit");
    setEditing(note);
    setDialogOpen(true);
  }

  function handleNoteUpdated(updated: NoteDTO) {
    setNotes((prev) =>
      sortNotesNewestFirst(
        prev.map((n) => (n.id === updated.id ? updated : n))
      )
    );
  }

  async function handleTogglePin(note: NoteDTO) {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    if (res.ok) {
      const data = (await res.json()) as { note?: NoteDTO };
      if (data.note) {
        setNotes((prev) =>
          sortNotesNewestFirst(
            prev.map((n) => (n.id === data.note!.id ? data.note! : n))
          )
        );
      } else {
        await refresh();
      }
    }
  }

  async function handleDelete(note: NoteDTO) {
    if (
      !window.confirm(
        `Delete "${note.title}"? This cannot be undone.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (res.ok) {
      if (viewingId === note.id) {
        setViewOpen(false);
        setViewingId(null);
      }
      await refresh();
    }
  }

  return (
    <div className="relative mx-auto flex min-h-0 w-full min-w-0 max-w-5xl flex-1 flex-col px-3 pt-4 pb-4 max-lg:max-w-none max-sm:pt-2 mobile-landscape:!px-3 mobile-landscape:!pt-2 mobile-landscape:!pb-2 sm:px-6 sm:pt-12 sm:pb-8">
      <div className="mb-2 hidden items-center justify-between gap-3 max-sm:flex mobile-landscape:hidden">
        <h1 className="min-w-0 font-heading text-2xl font-semibold tracking-tight">
          <span className="text-gradient-brand">{pageTitle}</span>
        </h1>
        <DashboardAccountButton />
      </div>

      {showAllCollections ? null : (
        <Button
          type="button"
          size="lg"
          className="mb-2 hidden w-full shrink-0 shadow-brand transition-transform hover:-translate-y-px max-sm:inline-flex mobile-landscape:hidden"
          onClick={handleAddToCollectionClick}
        >
          {selectedCollection ? "Add to collection" : "Add note"}
        </Button>
      )}

      <div className="relative shrink-0 mobile-landscape:space-y-1">
        <div
          className={cn(
            "relative flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
            "mobile-landscape:grid mobile-landscape:grid-cols-[auto_minmax(0,1fr)_auto] mobile-landscape:items-center mobile-landscape:gap-2"
          )}
        >
          <div className="min-w-0 mobile-landscape:col-start-1">
            <h1 className="min-w-0 font-heading text-2xl font-semibold tracking-tight max-sm:hidden mobile-landscape:text-lg mobile-landscape:leading-tight mobile-landscape:block sm:text-3xl">
              <span className="text-gradient-brand">{pageTitle}</span>
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-sm:mt-0 mobile-landscape:hidden sm:mt-1.5">
              <span className="block sm:inline">
                {showAllCollections ? (
                  "Tap a collection to open it"
                ) : selectedCollection ? (
                  <>
                    {selectedCollection.noteCount} note
                    {selectedCollection.noteCount === 1 ? "" : "s"} in collection
                  </>
                ) : (
                  "Newest first"
                )}
              </span>
              {dateFilterActive ? (
                <span className="mt-1 block sm:mt-0 sm:inline">
                  {showAllCollections || selectedCollection ? " · " : null}
                  Filtered:{" "}
                  <CalendarFilterShortStatus selected={selectedDates} />
                </span>
              ) : null}
              {searchActive ? (
                <span className="mt-1 block sm:mt-0 sm:inline">
                  {(showAllCollections ||
                    selectedCollection ||
                    dateFilterActive)
                    ? " · "
                    : null}
                  <span className="text-foreground/90">
                    {`Search: "${searchQuery.trim()}"`}
                  </span>
                </span>
              ) : null}
            </p>
          </div>

          {notes.length > 0 ? (
            <div className="relative hidden min-w-0 items-center gap-2 mobile-landscape:col-start-2 mobile-landscape:flex">
              <div className="relative min-w-0 flex-1">
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles and content…"
                  aria-label="Search notes"
                  className={cn(
                    "h-9 rounded-lg border-border/70 bg-background/70 pr-10 pl-9 text-sm shadow-sm backdrop-blur-md",
                    "placeholder:text-muted-foreground/80",
                    "focus-visible:border-primary/40 focus-visible:ring-primary/20"
                  )}
                  autoComplete="off"
                />
                {searchActive ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <XIcon className="size-4" />
                  </button>
                ) : null}
              </div>
              <DashboardAccountButton />
            </div>
          ) : (
            <div className="hidden mobile-landscape:col-start-2 mobile-landscape:flex mobile-landscape:justify-end">
              <DashboardAccountButton />
            </div>
          )}

          {showAllCollections ? null : (
            <Button
              type="button"
              size="lg"
              className="hidden w-full shrink-0 shadow-brand transition-transform hover:-translate-y-px max-sm:hidden sm:inline-flex sm:w-auto mobile-landscape:col-start-3 mobile-landscape:inline-flex mobile-landscape:h-9 mobile-landscape:px-3 mobile-landscape:text-sm"
              onClick={handleAddToCollectionClick}
            >
              {selectedCollection ? "Add to collection" : "Add note"}
            </Button>
          )}
        </div>

        {notes.length > 0 ? (
          <div className="relative mt-4 max-sm:mt-2 sm:mt-6 mobile-landscape:hidden">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search titles and content…"
              aria-label="Search notes"
              className={cn(
                "h-11 rounded-xl border-border/70 bg-background/70 pr-10 pl-9 shadow-sm backdrop-blur-md",
                "placeholder:text-muted-foreground/80",
                "focus-visible:border-primary/40 focus-visible:ring-primary/20"
              )}
              autoComplete="off"
            />
            {searchActive ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {dateFilterActive && notesMatchingDates.length > 0 ? (
        <div className="relative mt-4 flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 mobile-landscape:hidden sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            {notesMatchingDates.length} note
            {notesMatchingDates.length === 1 ? "" : "s"} on{" "}
            <CalendarFilterShortStatus selected={selectedDates} />
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() =>
              openCreateCollection(notesMatchingDates.map((n) => n.id))
            }
          >
            Create collection
          </Button>
        </div>
      ) : null}

      {selectedCollection && !showAllCollections ? (
        <CollectionSummaryPanel
          collection={selectedCollection}
          summary={collectionSummary}
          summarizing={collectionSummarizing}
          error={collectionSummaryError}
          onSummarize={() => void runCollectionSummarize()}
          onDismiss={() => setCollectionSummary(null)}
          className="mobile-landscape:hidden"
        />
      ) : null}

      {notes.length === 0 ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden mobile-landscape:mt-1 mobile-landscape:gap-1 sm:gap-4 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
          <div className="shrink-0 lg:hidden">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between gap-2 px-4 mobile-landscape:h-9 mobile-landscape:text-sm"
              aria-expanded={mobileToolsOpen}
              onClick={() => setMobileToolsOpen((open) => !open)}
            >
              <span>Settings</span>
              <ChevronDownIcon
                aria-hidden
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  mobileToolsOpen && "rotate-180"
                )}
              />
            </Button>
          </div>
          <aside
            className={cn(
              "self-start overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md lg:max-h-full lg:overflow-y-auto",
              mobileToolsOpen
                ? "max-lg:max-h-[min(50vh,480px)] max-lg:overflow-y-auto"
                : "max-lg:hidden"
            )}
          >
            <OpenAiKeyPanel
              embedded
              status={openAiStatus}
              onStatusChange={(status) => {
                setOpenAiStatus(status);
              }}
            />
          </aside>
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-gradient-to-br from-card/90 via-muted/40 to-accent/20 px-5 py-12 text-center shadow-sm backdrop-blur-sm sm:px-6 sm:py-14 max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--mesh-glow-3),transparent_55%)] opacity-60"
              aria-hidden
            />
            <div className="relative">
              <p className="text-sm font-semibold text-foreground">No notes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first note to see it here.
              </p>
              <Button
                type="button"
                className="mt-6 shadow-brand"
                onClick={openCreate}
              >
                Add note
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden mobile-landscape:mt-1 mobile-landscape:gap-1 sm:gap-4 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
          <div className="shrink-0 lg:hidden">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between gap-2 px-4 mobile-landscape:h-9 mobile-landscape:text-sm"
              aria-expanded={mobileToolsOpen}
              onClick={() => setMobileToolsOpen((open) => !open)}
            >
              <span>Filters & tools</span>
              <ChevronDownIcon
                aria-hidden
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  mobileToolsOpen && "rotate-180"
                )}
              />
            </Button>
          </div>
          <aside
            className={cn(
              "self-start divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md lg:max-h-full lg:overflow-y-auto",
              mobileToolsOpen
                ? "max-lg:max-h-[min(50vh,480px)] max-lg:overflow-y-auto"
                : "max-lg:hidden"
            )}
          >
            <OpenAiKeyPanel
              embedded
              status={openAiStatus}
              onStatusChange={setOpenAiStatus}
            />
            <NotesPinnedPanel
              embedded
              notes={notesMatchingSearch}
              onOpen={openView}
              onEdit={openEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
            <NotesCollectionsPanel
              embedded
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              onSelectCollection={selectCollection}
              onCreateCollection={() => openCreateCollection([])}
              showAllCollections={showAllCollections}
              onToggleShowAll={() => setShowAllCollections((v) => !v)}
            />
            <NotesCalendarFilter
              embedded
              notes={notes}
              selected={selectedDates}
              onSelect={setSelectedDates}
            />
          </aside>
          <div className="min-h-0 h-full min-w-0 w-full flex-1 overflow-y-auto overscroll-y-contain rounded-2xl border border-border/50 bg-card/30 p-1 shadow-sm sm:p-1.5 max-lg:rounded-xl max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none">
            {showAllCollections ? (
              <CollectionsBrowseGrid
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onOpenCollection={openCollection}
              />
            ) : notesOrderedForDisplay.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                {searchActive && notesMatchingSearch.length === 0 ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No notes match your search
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try different words or clear the search box.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  </>
                ) : selectedCollection &&
                  selectedCollection.noteCount === 0 &&
                  !searchActive ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      This collection is empty
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Use Add to collection to create a new note or add existing
                      ones.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={openAddToCollection}
                    >
                      Add to collection
                    </Button>
                  </>
                ) : selectedCollection && !searchActive ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No notes in {selectedCollection.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateFilterActive
                        ? `Nothing in this collection on ${dateFilterLabel}.`
                        : "Try clearing filters or add notes to this collection."}
                    </p>
                    {dateFilterActive ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setSelectedDates(undefined)}
                      >
                        Clear date filter
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => selectCollection(null)}
                      >
                        Show all notes
                      </Button>
                    )}
                  </>
                ) : searchActive && dateFilterActive && notesMatchingSearch.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No matching notes on selected dates
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {`You have notes that match "${searchQuery.trim()}", but none on ${dateFilterLabel}. Try other dates or clear the calendar filter.`}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSelectedDates(undefined)}
                    >
                      Show all matching notes
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No notes on selected dates
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateFilterLabel
                        ? `Nothing created on ${dateFilterLabel}. Try other dates or clear the filter.`
                        : "Try other dates or clear the filter."}
                    </p>
                    {dateFilterActive ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setSelectedDates(undefined)}
                      >
                        Show all notes
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <ul className="grid min-w-0 auto-rows-fr gap-4 mobile-landscape:gap-2 sm:grid-cols-2 sm:gap-5 sm:p-3 lg:grid-cols-1 lg:p-4 xl:grid-cols-2">
                {notesOrderedForDisplay.map((note) => (
                  <li key={note.id} className="min-h-0 h-full">
                    <NoteCard
                      note={note}
                      onOpen={openView}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <NoteViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        note={viewingNote}
        openAiStatus={openAiStatus}
        onRequestOpenAiKey={(reason, pendingAction) => {
          if (pendingAction === "polish") {
            setPolishAfterKeySave(true);
          } else {
            setSummarizeAfterKeySave(true);
          }
          requestOpenAiKey(reason);
        }}
        summarizeAfterKeySave={summarizeAfterKeySave}
        onSummarizeAfterKeyConsumed={() => setSummarizeAfterKeySave(false)}
        polishAfterKeySave={polishAfterKeySave}
        onPolishAfterKeyConsumed={() => setPolishAfterKeySave(false)}
        onNoteUpdated={handleNoteUpdated}
        onEdit={openEdit}
        onDelete={handleDelete}
        onTogglePin={handleTogglePin}
        collections={collections}
        onCollectionsChange={handleNoteCollectionsChange}
      />
      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        note={dialogMode === "edit" ? editing : null}
        onSaved={refresh}
        openAiStatus={openAiStatus}
        onRequestOpenAiKey={(reason) => {
          setEnhanceAfterKeySave(true);
          requestOpenAiKey(reason);
        }}
        enhanceAfterKeySave={enhanceAfterKeySave}
        onEnhanceAfterKeyConsumed={() => setEnhanceAfterKeySave(false)}
        collections={collections}
        defaultCollectionIds={createDefaultCollectionIds}
      />
      <CreateCollectionDialog
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
        noteIds={createCollectionNoteIds}
        suggestedName={suggestedCollectionName}
        onCreated={handleCollectionCreated}
      />
      <AddToCollectionDialog
        open={addToCollectionOpen}
        onOpenChange={setAddToCollectionOpen}
        collection={selectedCollection}
        notes={notes}
        onCreateNew={openCreate}
        onAdded={refresh}
      />
      <OpenAiKeyDialog
        open={keyDialogOpen}
        onOpenChange={(open) => {
          setKeyDialogOpen(open);
          if (!open) {
            setKeyDialogReason(undefined);
            if (!keySaveSucceeded.current) {
              setEnhanceAfterKeySave(false);
              setSummarizeAfterKeySave(false);
              setSummarizeCollectionAfterKeySave(false);
            }
            keySaveSucceeded.current = false;
          }
        }}
        status={openAiStatus}
        onStatusChange={setOpenAiStatus}
        reason={keyDialogReason}
        onSaved={() => {
          keySaveSucceeded.current = true;
          void refreshOpenAiStatus();
        }}
      />
      <OpenAiOnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        status={openAiStatus}
        onStatusChange={setOpenAiStatus}
        onDismiss={dismissOpenAiOnboarding}
      />
    </div>
  );
}
