import { createOpenAIClient, getOpenAIModel } from "@/lib/openai-client";

const SYSTEM = `You summarise personal notes for quick reading. Capture the main points in plain language. Do not add facts that are not in the note.

Respond with ONLY a single JSON object, no markdown fences, no extra keys:
{"summary":"..."}

Rules:
- "summary": 1–4 short paragraphs or a tight bullet list when the note is list-like; never empty.
- Stay faithful to the source; if the body is empty, summarise from the title only.`;

function extractJsonObject(text: string): string {
  const t = text.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("AI response did not contain JSON");
  }
  return t.slice(start, end + 1);
}

export async function summarizeNoteContent(
  title: string,
  content: string,
  apiKey: string
): Promise<string> {
  const openai = createOpenAIClient(apiKey);
  const model = getOpenAIModel();

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM,
    input: `Note title:\n${title}\n\nNote content:\n${content || "(empty)"}`,
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
    typeof (parsed as { summary?: unknown }).summary !== "string"
  ) {
    throw new Error("AI returned invalid JSON shape");
  }

  const summary = (parsed as { summary: string }).summary.trim();
  if (!summary) {
    throw new Error("AI returned an empty summary");
  }

  return summary.slice(0, 10_000);
}
