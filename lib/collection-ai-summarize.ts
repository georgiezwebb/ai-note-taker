import { NextResponse } from "next/server";

import { OpenAiEnhanceError, mapOpenAiEnhanceError } from "@/lib/openai-errors";
import { openAiEnhanceErrorResponse } from "@/lib/note-ai-enhance";
import { summarizeCollectionContent } from "@/lib/summarize-collection";
import { resolveOpenAiApiKeyForUser } from "@/lib/openai-user-key";

export async function summarizeCollectionForUser(
  userId: string,
  collectionName: string,
  notes: { title: string; content: string; createdAt?: string }[]
): Promise<string | NextResponse> {
  const apiKey = await resolveOpenAiApiKeyForUser(userId);
  if (!apiKey) {
    return openAiEnhanceErrorResponse(
      new OpenAiEnhanceError(
        "missing_key",
        "Add your OpenAI API key to summarise collections, or ask your admin to configure a server key."
      )
    );
  }

  try {
    return await summarizeCollectionContent(collectionName, notes, apiKey);
  } catch (err) {
    if (err instanceof OpenAiEnhanceError) {
      return openAiEnhanceErrorResponse(err);
    }
    const mapped = mapOpenAiEnhanceError(err);
    return openAiEnhanceErrorResponse(mapped);
  }
}
