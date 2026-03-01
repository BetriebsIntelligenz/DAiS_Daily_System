-- AlterTable
ALTER TABLE "ResultObject"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'open';
