-- AlterTable
ALTER TABLE "User" ADD COLUMN "openaiKeyCiphertext" TEXT,
ADD COLUMN "openaiKeyLastFour" TEXT,
ADD COLUMN "openaiKeyUpdatedAt" TIMESTAMP(3),
ADD COLUMN "aiKeyOnboardingDismissedAt" TIMESTAMP(3);
