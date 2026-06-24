import { prisma } from "@/lib/db";
import {
  decryptOpenAiKey,
  encryptOpenAiKey,
} from "@/lib/openai-key-crypto";
import type { OpenAiKeyEntryDTO, OpenAiKeyStatusDTO } from "@/lib/openai-key-types";
import { mapOpenAiEnhanceError } from "@/lib/openai-errors";
import { createOpenAIClient } from "@/lib/openai-client";

const DEFAULT_KEY_NAME_PATTERN = /^Key (\d+)$/;

function keyLastFour(apiKey: string): string {
  const trimmed = apiKey.trim();
  return trimmed.length >= 4 ? trimmed.slice(-4) : trimmed;
}

export function formatOpenAiKeyHint(lastFour: string | null | undefined): string | null {
  if (!lastFour) {
    return null;
  }
  return `sk-…${lastFour}`;
}

export function suggestDefaultOpenAiKeyName(existingNames: string[]): string {
  const usedNumbers = new Set<number>();
  for (const name of existingNames) {
    const match = DEFAULT_KEY_NAME_PATTERN.exec(name.trim());
    if (match) {
      usedNumbers.add(Number.parseInt(match[1]!, 10));
    }
  }
  let n = 1;
  while (usedNumbers.has(n)) {
    n += 1;
  }
  return `Key ${n}`;
}

export function hasServerOpenAiFallback(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function toKeyEntry(key: {
  id: string;
  name: string;
  lastFour: string;
  updatedAt: Date;
}): OpenAiKeyEntryDTO {
  return {
    id: key.id,
    name: key.name,
    keyHint: formatOpenAiKeyHint(key.lastFour) ?? `sk-…${key.lastFour}`,
    updatedAt: key.updatedAt.toISOString(),
  };
}

export function buildOpenAiKeyStatus(input: {
  keys: OpenAiKeyEntryDTO[];
  onboardingDismissed: boolean;
}): OpenAiKeyStatusDTO {
  const hasUserKey = input.keys.length > 0;
  const hasServerFallback = hasServerOpenAiFallback();
  return {
    keys: input.keys,
    suggestedKeyName: suggestDefaultOpenAiKeyName(input.keys.map((k) => k.name)),
    hasUserKey,
    keyHint: input.keys[0]?.keyHint ?? null,
    hasServerFallback,
    aiAvailable: hasUserKey || hasServerFallback,
    onboardingDismissed: input.onboardingDismissed,
  };
}

async function loadUserKeyStatus(userId: string): Promise<OpenAiKeyStatusDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      aiKeyOnboardingDismissedAt: true,
      openAiKeys: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          lastFour: true,
          updatedAt: true,
        },
      },
    },
  });
  if (!user) {
    return null;
  }
  return buildOpenAiKeyStatus({
    keys: user.openAiKeys.map(toKeyEntry),
    onboardingDismissed: Boolean(user.aiKeyOnboardingDismissedAt),
  });
}

export async function getOpenAiKeyStatusForUser(
  userId: string
): Promise<OpenAiKeyStatusDTO | null> {
  return loadUserKeyStatus(userId);
}

export async function resolveOpenAiApiKeyForUser(
  userId: string
): Promise<string | null> {
  const key = await prisma.userOpenAiKey.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { ciphertext: true },
  });
  if (!key) {
    return process.env.OPENAI_API_KEY?.trim() ?? null;
  }
  try {
    return decryptOpenAiKey(key.ciphertext);
  } catch {
    return null;
  }
}

export async function validateOpenAiApiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (!trimmed.startsWith("sk-")) {
    throw mapOpenAiEnhanceError(
      new Error("OpenAI API keys usually start with sk-")
    );
  }
  const client = createOpenAIClient(trimmed);
  try {
    await client.models.list();
  } catch (err) {
    throw mapOpenAiEnhanceError(err);
  }
}

export async function createUserOpenAiApiKey(
  userId: string,
  apiKey: string,
  name?: string
): Promise<OpenAiKeyStatusDTO> {
  const trimmed = apiKey.trim();
  await validateOpenAiApiKey(trimmed);

  const existing = await prisma.userOpenAiKey.findMany({
    where: { userId },
    select: { name: true },
  });
  const resolvedName =
    name?.trim() ||
    suggestDefaultOpenAiKeyName(existing.map((k) => k.name));

  await prisma.userOpenAiKey.create({
    data: {
      userId,
      name: resolvedName,
      ciphertext: encryptOpenAiKey(trimmed),
      lastFour: keyLastFour(trimmed),
    },
  });

  const status = await loadUserKeyStatus(userId);
  if (!status) {
    throw new Error("User not found");
  }
  return status;
}

export async function updateUserOpenAiKeyName(
  userId: string,
  keyId: string,
  name: string
): Promise<OpenAiKeyStatusDTO> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Name is required");
  }

  const updated = await prisma.userOpenAiKey.updateMany({
    where: { id: keyId, userId },
    data: { name: trimmed },
  });
  if (updated.count === 0) {
    throw new Error("Key not found");
  }

  const status = await loadUserKeyStatus(userId);
  if (!status) {
    throw new Error("User not found");
  }
  return status;
}

export async function removeUserOpenAiApiKey(
  userId: string,
  keyId: string
): Promise<OpenAiKeyStatusDTO> {
  const deleted = await prisma.userOpenAiKey.deleteMany({
    where: { id: keyId, userId },
  });
  if (deleted.count === 0) {
    throw new Error("Key not found");
  }

  const status = await loadUserKeyStatus(userId);
  if (!status) {
    throw new Error("User not found");
  }
  return status;
}

export async function dismissOpenAiKeyOnboarding(
  userId: string
): Promise<OpenAiKeyStatusDTO> {
  await prisma.user.update({
    where: { id: userId },
    data: { aiKeyOnboardingDismissedAt: new Date() },
  });

  const status = await loadUserKeyStatus(userId);
  if (!status) {
    throw new Error("User not found");
  }
  return status;
}
