import OpenAI from "openai";

import type { OpenAiEnhanceErrorCode } from "@/lib/openai-key-types";

export class OpenAiEnhanceError extends Error {
  code: OpenAiEnhanceErrorCode;

  constructor(code: OpenAiEnhanceErrorCode, message: string) {
    super(message);
    this.name = "OpenAiEnhanceError";
    this.code = code;
  }
}

export function mapOpenAiEnhanceError(err: unknown): OpenAiEnhanceError {
  if (err instanceof OpenAiEnhanceError) {
    return err;
  }

  if (err instanceof OpenAI.APIError) {
    const status = err.status;
    const code = err.code ?? "";
    const message = (err.message ?? "").toLowerCase();

    if (
      status === 401 ||
      code === "invalid_api_key" ||
      message.includes("incorrect api key")
    ) {
      return new OpenAiEnhanceError(
        "invalid_key",
        "Your OpenAI API key is invalid or expired. Update it in AI settings."
      );
    }

    if (
      status === 429 ||
      code === "insufficient_quota" ||
      message.includes("insufficient_quota") ||
      message.includes("exceeded your current quota")
    ) {
      return new OpenAiEnhanceError(
        "quota",
        "Your OpenAI account is out of credits or quota. Add billing or use a different key."
      );
    }

    if (code === "rate_limit_exceeded" || message.includes("rate limit")) {
      return new OpenAiEnhanceError(
        "rate_limit",
        "OpenAI rate limit hit. Wait a moment and try again."
      );
    }
  }

  if (err instanceof Error) {
    if (err.message.includes("OPENAI_KEY_ENCRYPTION_SECRET")) {
      return new OpenAiEnhanceError(
        "generic",
        "Server encryption is not configured. Contact the app administrator."
      );
    }
    return new OpenAiEnhanceError("generic", err.message);
  }

  return new OpenAiEnhanceError("generic", "AI enhancement failed");
}
