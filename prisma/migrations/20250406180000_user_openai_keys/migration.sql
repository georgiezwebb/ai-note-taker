-- CreateTable
CREATE TABLE "UserOpenAiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOpenAiKey_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single keys as "Key 1"
INSERT INTO "UserOpenAiKey" ("id", "userId", "name", "ciphertext", "lastFour", "createdAt", "updatedAt")
SELECT
    'mig_' || "id",
    "id",
    'Key 1',
    "openaiKeyCiphertext",
    "openaiKeyLastFour",
    COALESCE("openaiKeyUpdatedAt", CURRENT_TIMESTAMP),
    COALESCE("openaiKeyUpdatedAt", CURRENT_TIMESTAMP)
FROM "User"
WHERE "openaiKeyCiphertext" IS NOT NULL;

-- DropColumn
ALTER TABLE "User" DROP COLUMN "openaiKeyCiphertext",
DROP COLUMN "openaiKeyLastFour",
DROP COLUMN "openaiKeyUpdatedAt";

-- CreateIndex
CREATE INDEX "UserOpenAiKey_userId_idx" ON "UserOpenAiKey"("userId");

-- AddForeignKey
ALTER TABLE "UserOpenAiKey" ADD CONSTRAINT "UserOpenAiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
