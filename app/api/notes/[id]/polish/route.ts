import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import { prisma } from "@/lib/db";
import {
  enhanceNoteFieldsForUser,
  openAiEnhanceErrorResponse,
} from "@/lib/note-ai-enhance";
import { OpenAiEnhanceError } from "@/lib/openai-errors";

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

  try {
    const polished = await enhanceNoteFieldsForUser(
      user.id,
      note.title,
      note.content
    );
    return NextResponse.json({
      polished,
      original: { title: note.title, content: note.content },
    });
  } catch (err) {
    if (err instanceof OpenAiEnhanceError) {
      return openAiEnhanceErrorResponse(err);
    }
    const message = err instanceof Error ? err.message : "Could not polish note";
    return NextResponse.json({ error: message, code: "generic" }, { status: 502 });
  }
}
