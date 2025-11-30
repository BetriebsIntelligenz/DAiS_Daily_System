-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('open', 'in_progress', 'problem', 'done');

-- CreateEnum
CREATE TYPE "RequirementArea" AS ENUM ('privat', 'finanzen', 'arbeit', 'staat');

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "requester" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "area" "RequirementArea" NOT NULL,
    "status" "RequirementStatus" NOT NULL DEFAULT 'open',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
