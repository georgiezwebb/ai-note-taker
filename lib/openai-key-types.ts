export type OpenAiEnhanceErrorCode =
  | "missing_key"
  | "invalid_key"
  | "quota"
  | "rate_limit"
  | "generic";

export type OpenAiKeyEntryDTO = {
  id: string;
  name: string;
  keyHint: string;
  updatedAt: string;
};

export type OpenAiKeyStatusDTO = {
  keys: OpenAiKeyEntryDTO[];
  suggestedKeyName: string;
  /** @deprecated Use keys.length — kept for existing UI checks */
  hasUserKey: boolean;
  /** @deprecated Use keys[0]?.keyHint — kept for existing UI checks */
  keyHint: string | null;
  hasServerFallback: boolean;
  aiAvailable: boolean;
  onboardingDismissed: boolean;
};
