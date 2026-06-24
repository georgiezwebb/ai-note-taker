import { createOpenAIClient, getOpenAIModel } from "@/lib/openai-client";

const SYSTEM = `You summarise groups of personal notes that belong to one collection. Synthesise themes, key points, and any action items across all notes. Do not invent facts that are not supported by the notes.

Respond with ONLY a single JSON object, no markdown fences, no extra keys:
{"summary":"..."}

Rules:
- "summary": 2–6 short paragraphs, or a tight bullet list when notes are list-like; never empty.
- Mention major themes and how notes relate when possible.
- If notes are sparse or repetitive, say so briefly and still produce a useful overview.`;

const MAX_NOTES = 40;
const MAX_CHARS_PER_NOTE = 2_500;
const MAX_TOTAL_CHARS = 80_000;

function extractJsonObject(text: string): string {
  const t = text.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("AI response did not contain JSON");
  }
  return t.slice(start, end + 1);
}

export type CollectionNoteInput = {
  title: string;
  content: string;
  createdAt?: string;
};

function buildCollectionInput(
  collectionName: string,
  notes: CollectionNoteInput[]
): string {
  const limited = notes.slice(0, MAX_NOTES);
  let total = 0;
  const parts: string[] = [`Collection name: ${collectionName}`, ""];

  for (let i = 0; i < limited.length; i += 1) {
    const note = limited[i]!;
    let body = (note.content || "").trim() || "(empty)";
    if (body.length > MAX_CHARS_PER_NOTE) {
      body = `${body.slice(0, MAX_CHARS_PER_NOTE)}…`;
    }
    const block = `--- Note ${i + 1}: ${note.title} ---\n${body}`;
    if (total + block.length > MAX_TOTAL_CHARS) {
      parts.push(
        `\n(${limited.length - i} more note(s) omitted due to length limits.)`
      );
      break;
    }
    parts.push(block);
    total += block.length;
  }

  if (notes.length > MAX_NOTES) {
    parts.push(
      `\n(${notes.length - MAX_NOTES} additional note(s) not included; summarising the first ${MAX_NOTES}.)`
    );
  }

  return parts.join("\n\n");
}

export async function summarizeCollectionContent(
  collectionName: string,
  notes: CollectionNoteInput[],
  apiKey: string
): Promise<string> {
  if (notes.length === 0) {
    throw new Error("Collection has no notes to summarise");
  }

  const openai = createOpenAIClient(apiKey);
  const model = getOpenAIModel();

  const response = await openai.responses.create({
    model,
    instructions: SYSTEM,
    input: buildCollectionInput(collectionName, notes),
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

  return summary.slice(0, 12_000);
}
