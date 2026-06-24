import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import {
  addNotesToCollection,
  getCollectionsForUser,
  mapCollectionToDTO,
  verifyNoteIdsOwned,
} from "@/lib/collections-db";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.collection.findFirst({
    where: { id, userId: user.id },
    include: { notes: { select: { noteId: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, addNoteIds, removeNoteIds } = body as {
    name?: unknown;
    addNoteIds?: unknown;
    removeNoteIds?: unknown;
  };

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    await prisma.collection.update({
      where: { id },
      data: { name: name.trim() },
    });
  }

  const toAdd = Array.isArray(addNoteIds)
    ? addNoteIds.filter((n): n is string => typeof n === "string")
    : [];
  const toRemove = Array.isArray(removeNoteIds)
    ? removeNoteIds.filter((n): n is string => typeof n === "string")
    : [];

  if (toAdd.length > 0) {
    if (!(await verifyNoteIdsOwned(user.id, toAdd))) {
      return NextResponse.json({ error: "Invalid note" }, { status: 400 });
    }
    await addNotesToCollection(user.id, id, toAdd);
  }

  if (toRemove.length > 0) {
    await prisma.collectionNote.deleteMany({
      where: { collectionId: id, noteId: { in: toRemove } },
    });
    await prisma.collection.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  const updated = await prisma.collection.findFirst({
    where: { id },
    include: { notes: { select: { noteId: true } } },
  });
  const list = await getCollectionsForUser(user.id);
  return NextResponse.json({
    collection: updated ? mapCollectionToDTO(updated) : null,
    ...list,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.collection.deleteMany({
    where: { id, userId: user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const list = await getCollectionsForUser(user.id);
  return NextResponse.json(list);
}
