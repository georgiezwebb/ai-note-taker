import { createOpenAIClient, getOpenAIModel } from "@/lib/openai-client";

const SYSTEM = `You polish short personal notes: clearer wording, light structure (short paragraphs; bullet lines only when the draft is already list-like). Keep the author's meaning and tone. Do not add facts the user did not imply.

Respond with ONLY a single JSON object, no markdown fences, no extra keys, with exactly these string fields:
{"title":"...","content":"..."}

Rules:
- "title": concise; preserve or slightly improve the user's title; never empty.
- "content": the polished body; if the user left the body empty, return an empty string for content.`;

function extractJsonObject(text: string): string {
  const t = text.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("AI response did not contain JSON");
  }
  return t.slice(start, end + 1);
}

export async function polishNoteDraft(
  title: string,
  content: string,
  apiKey: string
): Promise<{ title: string; content: string }> {
  const openai = createOpenAIClient(apiKey);
  const model = getOpenAIModel();

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM,
    input: `Draft title:\n${title}\n\nDraft content:\n${content || "(empty)"}`,
  });

  const raw = response.output_text?.trim();
  if (!raw) {
    throw new Error("Empty response from AI");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch {
    throw new Error("Could not parse AI response as JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { title?: unknown }).title !== "string" ||
    typeof (parsed as { content?: unknown }).content !== "string"
  ) {
    throw new Error("AI returned invalid JSON shape");
  }

  const out = parsed as { title: string; content: string };
  const polishedTitle = out.title.trim();
  if (!polishedTitle) {
    throw new Error("AI returned an empty title");
  }

  return {
    title: polishedTitle.slice(0, 500),
    content: out.content.slice(0, 100_000),
  };
}
