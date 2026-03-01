import { prisma } from "@/lib/prisma";

let resultsSchemaReady = false;
let resultsSchemaInitPromise: Promise<void> | null = null;

export async function ensureResultsSchema() {
  if (resultsSchemaReady) {
    return;
  }

  if (!resultsSchemaInitPromise) {
    resultsSchemaInitPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ResultObject" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "name" TEXT NOT NULL,
          "icon" TEXT NOT NULL DEFAULT '🎯',
          "status" TEXT NOT NULL DEFAULT 'open',
          "startDate" TIMESTAMP(3),
          "deadline" TIMESTAMP(3),
          "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "stakeholder" TEXT,
          "outputFileType" TEXT,
          "checklist" JSONB NOT NULL DEFAULT '[]',
          "artifacts" JSONB NOT NULL DEFAULT '[]',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ResultObject_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ResultObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ResultLogEntry" (
          "id" TEXT NOT NULL,
          "resultId" TEXT NOT NULL,
          "userId" TEXT,
          "message" TEXT NOT NULL,
          "logType" TEXT NOT NULL DEFAULT 'manual',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ResultLogEntry_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ResultLogEntry_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ResultObject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ResultLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(
        `ALTER TABLE "ResultObject" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'open'`
      );

      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ResultObject_userId_idx" ON "ResultObject"("userId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ResultObject_updatedAt_idx" ON "ResultObject"("updatedAt")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ResultLogEntry_resultId_createdAt_idx" ON "ResultLogEntry"("resultId", "createdAt")`
      );

      resultsSchemaReady = true;
    })().catch((error) => {
      resultsSchemaInitPromise = null;
      throw error;
    });
  }

  await resultsSchemaInitPromise;
}
