import OpenAI from "openai";

let serverClient: OpenAI | null = null;

export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/** @deprecated Prefer createOpenAIClient with a per-user key. */
export function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!serverClient) {
    serverClient = createOpenAIClient(key);
  }
  return serverClient;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-5.4";
}
