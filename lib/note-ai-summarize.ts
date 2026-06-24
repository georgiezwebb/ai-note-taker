import { NextResponse } from "next/server";

import { OpenAiEnhanceError, mapOpenAiEnhanceError } from "@/lib/openai-errors";
import { summarizeNoteContent } from "@/lib/summarize-note";
import { resolveOpenAiApiKeyForUser } from "@/lib/openai-user-key";
import { openAiEnhanceErrorResponse } from "@/lib/note-ai-enhance";

export async function summarizeNoteForUser(
  userId: string,
  title: string,
  content: string
): Promise<string | NextResponse> {
  const apiKey = await resolveOpenAiApiKeyForUser(userId);
  if (!apiKey) {
    return openAiEnhanceErrorResponse(
      new OpenAiEnhanceError(
        "missing_key",
        "Add your OpenAI API key to summarise notes, or ask your admin to configure a server key."
      )
    );
  }

  try {
    return await summarizeNoteContent(title, content, apiKey);
  } catch (err) {
    if (err instanceof OpenAiEnhanceError) {
      return openAiEnhanceErrorResponse(err);
    }
    const mapped = mapOpenAiEnhanceError(err);
    return openAiEnhanceErrorResponse(mapped);
  }
}
