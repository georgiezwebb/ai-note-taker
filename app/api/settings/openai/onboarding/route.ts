import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/auth-db";
import { dismissOpenAiKeyOnboarding } from "@/lib/openai-user-key";

export async function POST() {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await dismissOpenAiKeyOnboarding(user.id);
  return NextResponse.json({ status });
}
