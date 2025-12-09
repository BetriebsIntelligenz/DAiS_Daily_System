-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('routine', 'training', 'healing', 'social', 'business', 'spiritual', 'brain');

-- CreateEnum
CREATE TYPE "ProgramPriority" AS ENUM ('core', 'optional');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('active', 'archived', 'experimental');

-- CreateEnum
CREATE TYPE "ProgramStateIntent" AS ENUM ('love', 'happiness', 'pride', 'power', 'calm', 'focus', 'gratitude', 'energy');

-- CreateEnum
CREATE TYPE "ProgramTimeWindow" AS ENUM ('morning_block', 'midday_block', 'evening_block', 'business_block', 'family_block', 'focus_block');

-- AlterEnum
ALTER TYPE "ProgramFrequency" ADD VALUE 'block_only';

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "defaultTimeWindow" "ProgramTimeWindow",
ADD COLUMN     "desiredState" "ProgramStateIntent",
ADD COLUMN     "expectedOutcome" TEXT,
ADD COLUMN     "linkedGoalIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "menuLogic" JSONB,
ADD COLUMN     "priority" "ProgramPriority" NOT NULL DEFAULT 'optional',
ADD COLUMN     "programType" "ProgramType" NOT NULL DEFAULT 'routine',
ADD COLUMN     "quality" JSONB,
ADD COLUMN     "result" JSONB,
ADD COLUMN     "ritual" JSONB,
ADD COLUMN     "roleTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "runnerConfig" JSONB,
ADD COLUMN     "scheduling" JSONB,
ADD COLUMN     "stateCheckAfter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stateCheckBefore" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "ProgramStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "xpRules" JSONB;

-- CreateTable
CREATE TABLE "RequirementLog" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequirementLog_requirementId_idx" ON "RequirementLog"("requirementId");

-- AddForeignKey
ALTER TABLE "RequirementLog" ADD CONSTRAINT "RequirementLog_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementLog" ADD CONSTRAINT "RequirementLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
