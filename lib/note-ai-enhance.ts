import { NextResponse } from "next/server";

import { OpenAiEnhanceError, mapOpenAiEnhanceError } from "@/lib/openai-errors";
import { polishNoteDraft } from "@/lib/polish-note";
import { resolveOpenAiApiKeyForUser } from "@/lib/openai-user-key";

export function openAiEnhanceErrorResponse(err: OpenAiEnhanceError) {
  return NextResponse.json(
    { error: err.message, code: err.code },
    {
      status:
        err.code === "invalid_key" || err.code === "quota"
          ? 402
          : err.code === "missing_key"
            ? 503
            : 502,
    }
  );
}

export async function enhanceNoteFieldsForUser(
  userId: string,
  title: string,
  content: string
): Promise<{ title: string; content: string }> {
  const apiKey = await resolveOpenAiApiKeyForUser(userId);
  if (!apiKey) {
    throw new OpenAiEnhanceError(
      "missing_key",
      "Add your OpenAI API key to use AI enhancement, or ask your admin to configure a server key."
    );
  }

  try {
    return await polishNoteDraft(title, content, apiKey);
  } catch (err) {
    throw mapOpenAiEnhanceError(err);
  }
}

export async function maybeEnhanceNoteFields(
  userId: string,
  title: string,
  content: string,
  enhanceWithAi: boolean
): Promise<{ title: string; content: string } | NextResponse> {
  if (!enhanceWithAi) {
    return { title, content };
  }

  try {
    const polished = await enhanceNoteFieldsForUser(userId, title, content);
    return polished;
  } catch (err) {
    if (err instanceof OpenAiEnhanceError) {
      return openAiEnhanceErrorResponse(err);
    }
    const message = err instanceof Error ? err.message : "AI enhancement failed";
    return NextResponse.json({ error: message, code: "generic" }, { status: 502 });
  }
}
