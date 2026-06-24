import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import { prisma } from "@/lib/db";
import { summarizeNoteForUser } from "@/lib/note-ai-summarize";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await summarizeNoteForUser(user.id, note.title, note.content);
  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json({ summary: result });
}
