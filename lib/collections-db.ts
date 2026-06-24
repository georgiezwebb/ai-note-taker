import type { CollectionDTO, CollectionsListDTO } from "@/lib/collection-types";
import { suggestDefaultCollectionName } from "@/lib/collection-names";
import type { NoteDTO } from "@/lib/note-types";
import { prisma } from "@/lib/db";

export const noteCollectionsInclude = {
  collections: {
    select: { collectionId: true },
  },
} as const;

export function mapNoteToDTO(row: {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  collections?: { collectionId: string }[];
}): NoteDTO {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    pinned: row.pinned,
    collectionIds: row.collections?.map((c) => c.collectionId) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapCollectionToDTO(row: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  notes: { noteId: string }[];
}): CollectionDTO {
  const noteIds = row.notes.map((n) => n.noteId);
  return {
    id: row.id,
    name: row.name,
    noteIds,
    noteCount: noteIds.length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCollectionsForUser(
  userId: string
): Promise<CollectionsListDTO> {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      notes: {
        select: { noteId: true },
      },
    },
  });
  const collections = rows.map(mapCollectionToDTO);
  return {
    collections,
    suggestedCollectionName: suggestDefaultCollectionName(
      collections.map((c) => c.name)
    ),
  };
}

export async function verifyNoteIdsOwned(
  userId: string,
  noteIds: string[]
): Promise<boolean> {
  if (noteIds.length === 0) {
    return true;
  }
  const count = await prisma.note.count({
    where: { userId, id: { in: noteIds } },
  });
  return count === noteIds.length;
}

export async function setNoteCollectionIds(
  userId: string,
  noteId: string,
  collectionIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(collectionIds)];
  const ownedCollections =
    uniqueIds.length === 0
      ? 0
      : await prisma.collection.count({
          where: { userId, id: { in: uniqueIds } },
        });
  if (ownedCollections !== uniqueIds.length) {
    throw new Error("Invalid collection");
  }

  await prisma.$transaction([
    prisma.collectionNote.deleteMany({ where: { noteId } }),
    ...(uniqueIds.length > 0
      ? [
          prisma.collectionNote.createMany({
            data: uniqueIds.map((collectionId) => ({
              collectionId,
              noteId,
            })),
          }),
        ]
      : []),
    prisma.collection.updateMany({
      where: { id: { in: uniqueIds } },
      data: { updatedAt: new Date() },
    }),
  ]);
}

export async function addNotesToCollection(
  userId: string,
  collectionId: string,
  noteIds: string[]
): Promise<void> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!collection) {
    throw new Error("Collection not found");
  }
  const uniqueNoteIds = [...new Set(noteIds)];
  if (!(await verifyNoteIdsOwned(userId, uniqueNoteIds))) {
    throw new Error("Invalid note");
  }
  await prisma.collectionNote.createMany({
    data: uniqueNoteIds.map((noteId) => ({ collectionId, noteId })),
    skipDuplicates: true,
  });
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
}
