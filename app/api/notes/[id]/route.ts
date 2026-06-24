import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import {
  mapNoteToDTO,
  noteCollectionsInclude,
  setNoteCollectionIds,
} from "@/lib/collections-db";
import { prisma } from "@/lib/db";
import { maybeEnhanceNoteFields } from "@/lib/note-ai-enhance";

async function getOwnedNote(userId: string, noteId: string) {
  return prisma.note.findFirst({
    where: { id: noteId, userId },
    include: noteCollectionsInclude,
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const note = await getOwnedNote(user.id, id);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ note: mapNoteToDTO(note) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedNote(user.id, id);
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

  const patch = body as {
    title?: unknown;
    content?: unknown;
    pinned?: unknown;
    enhanceWithAi?: unknown;
    collectionIds?: unknown;
  };
  const data: { title?: string; content?: string; pinned?: boolean } = {};

  if (patch.pinned !== undefined) {
    if (typeof patch.pinned !== "boolean") {
      return NextResponse.json({ error: "Invalid pinned" }, { status: 400 });
    }
    data.pinned = patch.pinned;
  }

  let titleForEnhance = existing.title;
  let contentForEnhance = existing.content;

  if (patch.title !== undefined) {
    if (typeof patch.title !== "string") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    const trimmed = patch.title.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    titleForEnhance = trimmed;
    data.title = trimmed;
  }

  if (patch.content !== undefined) {
    contentForEnhance =
      typeof patch.content === "string"
        ? patch.content
        : String(patch.content);
    data.content = contentForEnhance;
  }

  if (patch.enhanceWithAi === true) {
    const enhanced = await maybeEnhanceNoteFields(
      user.id,
      titleForEnhance,
      contentForEnhance,
      true
    );
    if (enhanced instanceof NextResponse) {
      return enhanced;
    }
    data.title = enhanced.title;
    data.content = enhanced.content;
  }

  const hasCollectionPatch = patch.collectionIds !== undefined;
  const collectionIds = hasCollectionPatch
    ? Array.isArray(patch.collectionIds)
      ? patch.collectionIds.filter((cid): cid is string => typeof cid === "string")
      : null
    : undefined;

  if (collectionIds === null) {
    return NextResponse.json({ error: "Invalid collectionIds" }, { status: 400 });
  }

  if (Object.keys(data).length === 0 && !hasCollectionPatch) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (Object.keys(data).length > 0) {
    await prisma.note.update({
      where: { id },
      data,
    });
  }

  if (hasCollectionPatch && collectionIds) {
    try {
      await setNoteCollectionIds(user.id, id, collectionIds);
    } catch {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }
  }

  const note = await getOwnedNote(user.id, id);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ note: mapNoteToDTO(note) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
