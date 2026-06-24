-- Idempotent repair for failed migration 20250406190000_collections.

CREATE TABLE IF NOT EXISTS "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CollectionNote" (
    "collectionId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionNote_pkey" PRIMARY KEY ("collectionId","noteId")
);

CREATE INDEX IF NOT EXISTS "Collection_userId_idx" ON "Collection"("userId");
CREATE INDEX IF NOT EXISTS "CollectionNote_noteId_idx" ON "CollectionNote"("noteId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Collection_userId_fkey'
  ) THEN
    ALTER TABLE "Collection"
      ADD CONSTRAINT "Collection_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CollectionNote_collectionId_fkey'
  ) THEN
    ALTER TABLE "CollectionNote"
      ADD CONSTRAINT "CollectionNote_collectionId_fkey"
      FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CollectionNote_noteId_fkey'
  ) THEN
    ALTER TABLE "CollectionNote"
      ADD CONSTRAINT "CollectionNote_noteId_fkey"
      FOREIGN KEY ("noteId") REFERENCES "Note"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
