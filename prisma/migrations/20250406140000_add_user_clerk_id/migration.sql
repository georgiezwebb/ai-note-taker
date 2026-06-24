-- User table was created before clerkId; align with current schema.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkId" TEXT;

-- Rows without Clerk cannot be used by the app; remove dependent notes first.
DELETE FROM "Note" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "clerkId" IS NULL);
DELETE FROM "User" WHERE "clerkId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "clerkId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkId_key" ON "User"("clerkId");
