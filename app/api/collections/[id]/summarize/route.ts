import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import { summarizeCollectionForUser } from "@/lib/collection-ai-summarize";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const collection = await prisma.collection.findFirst({
    where: { id, userId: user.id },
    include: {
      notes: {
        include: {
          note: {
            select: {
              title: true,
              content: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const notes = collection.notes
    .map((row) => row.note)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((n) => ({
      title: n.title,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    }));

  if (notes.length === 0) {
    return NextResponse.json(
      { error: "Add notes to this collection before summarising." },
      { status: 400 }
    );
  }

  const result = await summarizeCollectionForUser(
    user.id,
    collection.name,
    notes
  );
  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json({ summary: result });
}
