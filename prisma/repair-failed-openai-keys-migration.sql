-- Idempotent repair for failed migration 20250406180000_user_openai_keys.
-- Safe to run when the migration partially applied or failed mid-way.

CREATE TABLE IF NOT EXISTS "UserOpenAiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOpenAiKey_pkey" PRIMARY KEY ("id")
);

INSERT INTO "UserOpenAiKey" ("id", "userId", "name", "ciphertext", "lastFour", "createdAt", "updatedAt")
SELECT
    'mig_' || "id",
    "id",
    'Key 1',
    "openaiKeyCiphertext",
    COALESCE(NULLIF("openaiKeyLastFour", ''), RIGHT("openaiKeyCiphertext", 4), '????'),
    COALESCE("openaiKeyUpdatedAt", CURRENT_TIMESTAMP),
    COALESCE("openaiKeyUpdatedAt", CURRENT_TIMESTAMP)
FROM "User"
WHERE "openaiKeyCiphertext" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "UserOpenAiKey"
    WHERE "UserOpenAiKey"."id" = 'mig_' || "User"."id"
  );

ALTER TABLE "User" DROP COLUMN IF EXISTS "openaiKeyCiphertext";
ALTER TABLE "User" DROP COLUMN IF EXISTS "openaiKeyLastFour";
ALTER TABLE "User" DROP COLUMN IF EXISTS "openaiKeyUpdatedAt";

CREATE INDEX IF NOT EXISTS "UserOpenAiKey_userId_idx" ON "UserOpenAiKey"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserOpenAiKey_userId_fkey'
  ) THEN
    ALTER TABLE "UserOpenAiKey"
      ADD CONSTRAINT "UserOpenAiKey_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
