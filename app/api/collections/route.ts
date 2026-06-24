import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import {
  addNotesToCollection,
  getCollectionsForUser,
  mapCollectionToDTO,
  verifyNoteIdsOwned,
} from "@/lib/collections-db";
import { suggestDefaultCollectionName } from "@/lib/collection-names";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getCollectionsForUser(user.id);
  return NextResponse.json(data);
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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, noteIds } = body as { name?: unknown; noteIds?: unknown };
  const ids = Array.isArray(noteIds)
    ? noteIds.filter((id): id is string => typeof id === "string")
    : [];

  if (!(await verifyNoteIdsOwned(user.id, ids))) {
    return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  }

  const existing = await prisma.collection.findMany({
    where: { userId: user.id },
    select: { name: true },
  });
  const resolvedName =
    typeof name === "string" && name.trim()
      ? name.trim()
      : suggestDefaultCollectionName(existing.map((c) => c.name));

  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: resolvedName,
      ...(ids.length > 0
        ? {
            notes: {
              create: ids.map((noteId) => ({ noteId })),
            },
          }
        : {}),
    },
    include: {
      notes: { select: { noteId: true } },
    },
  });

  const list = await getCollectionsForUser(user.id);
  return NextResponse.json(
    { collection: mapCollectionToDTO(collection), ...list },
    { status: 201 }
  );
}
