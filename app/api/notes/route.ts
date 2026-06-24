import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import {
  mapNoteToDTO,
  noteCollectionsInclude,
  setNoteCollectionIds,
} from "@/lib/collections-db";
import { prisma } from "@/lib/db";
import { maybeEnhanceNoteFields } from "@/lib/note-ai-enhance";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: noteCollectionsInclude,
  });

  return NextResponse.json({ notes: notes.map(mapNoteToDTO) });
}

export async function POST(request: Request) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { title?: unknown }).title !== "string"
  ) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const {
    title,
    content,
    enhanceWithAi,
    pinned: pinnedRaw,
    collectionIds,
  } = body as {
    title: string;
    content?: unknown;
    enhanceWithAi?: unknown;
    pinned?: unknown;
    collectionIds?: unknown;
  };
  const pinned = pinnedRaw === true;
  const trimmed = title.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let contentStr =
    typeof content === "string" ? content : content == null ? "" : String(content);

  const enhanced = await maybeEnhanceNoteFields(
    user.id,
    trimmed,
    contentStr,
    enhanceWithAi === true
  );
  if (enhanced instanceof NextResponse) {
    return enhanced;
  }
  const finalTitle = enhanced.title;
  contentStr = enhanced.content;

  const ids = Array.isArray(collectionIds)
    ? collectionIds.filter((id): id is string => typeof id === "string")
    : [];

  const note = await prisma.note.create({
    data: {
      title: finalTitle,
      content: contentStr,
      userId: user.id,
      pinned,
    },
    include: noteCollectionsInclude,
  });

  if (ids.length > 0) {
    await setNoteCollectionIds(user.id, note.id, ids);
  }

  const withCollections = await prisma.note.findUnique({
    where: { id: note.id },
    include: noteCollectionsInclude,
  });

  return NextResponse.json(
    { note: mapNoteToDTO(withCollections ?? note) },
    { status: 201 }
  );
}
