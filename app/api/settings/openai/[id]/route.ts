import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import {
  removeUserOpenAiApiKey,
  updateUserOpenAiKeyName,
} from "@/lib/openai-user-key";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name } = body as { name?: unknown };
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const status = await updateUserOpenAiKeyName(user.id, id, name);
    return NextResponse.json({ status });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update key name";
    const statusCode = message === "Key not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const status = await removeUserOpenAiApiKey(user.id, id);
    return NextResponse.json({ status });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not remove API key";
    const statusCode = message === "Key not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
