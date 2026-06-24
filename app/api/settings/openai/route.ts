import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import { OpenAiEnhanceError } from "@/lib/openai-errors";
import {
  createUserOpenAiApiKey,
  getOpenAiKeyStatusForUser,
} from "@/lib/openai-user-key";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getOpenAiKeyStatusForUser(user.id);
  return NextResponse.json({ status });
}

export async function POST(request: Request) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { apiKey, name } = body as { apiKey?: unknown; name?: unknown };
  if (typeof apiKey !== "string") {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }

  const trimmed = apiKey.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }

  const resolvedName = typeof name === "string" ? name.trim() : undefined;

  try {
    const status = await createUserOpenAiApiKey(user.id, trimmed, resolvedName);
    return NextResponse.json({ status });
  } catch (err) {
    if (err instanceof OpenAiEnhanceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Could not save API key";
    const statusCode = message.includes("OPENAI_KEY_ENCRYPTION_SECRET")
      ? 503
      : message === "Key not found"
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
