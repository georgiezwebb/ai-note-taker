import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/app/generated/prisma/client";
import { explicitSslDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const fromEnv = process.env.DATABASE_URL;
  if (!fromEnv) {
    throw new Error("DATABASE_URL is not set");
  }
  const connectionString = explicitSslDatabaseUrl(fromEnv) ?? fromEnv;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
