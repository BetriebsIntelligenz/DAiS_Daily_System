-- CreateEnum
CREATE TYPE "HumanContactRelation" AS ENUM ('family', 'friend', 'colleague', 'business_partner', 'network');

-- CreateEnum
CREATE TYPE "HumanContactActivity" AS ENUM ('whatsapp', 'call', 'email', 'meeting', 'video_call');

-- CreateEnum
CREATE TYPE "HumanContactCadence" AS ENUM ('daily', 'weekly');

-- AlterTable
ALTER TABLE "ProgramStack" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "weekday" INTEGER;

-- CreateTable
CREATE TABLE "MindMeditationFlow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMeditationFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceChecklistItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindReadingBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindReadingBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindReadingLog" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT,
    "pages" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindReadingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindMeditationStep" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindMeditationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdTask" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdCardTask" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HouseholdCardTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdEntry" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programRunId" TEXT,
    "completedTaskIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseholdEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanContactPerson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" "HumanContactRelation" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanContactAssignment" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "activity" "HumanContactActivity" NOT NULL,
    "cadence" "HumanContactCadence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanContactAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanContactLog" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "userId" TEXT,
    "activity" "HumanContactActivity" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanContactLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MindReadingLog_createdAt_idx" ON "MindReadingLog"("createdAt");

-- CreateIndex
CREATE INDEX "MindReadingLog_bookId_idx" ON "MindReadingLog"("bookId");

-- CreateIndex
CREATE INDEX "MindMeditationStep_flowId_order_idx" ON "MindMeditationStep"("flowId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdCardTask_cardId_taskId_key" ON "HouseholdCardTask"("cardId", "taskId");

-- CreateIndex
CREATE INDEX "HouseholdEntry_createdAt_idx" ON "HouseholdEntry"("createdAt");

-- CreateIndex
CREATE INDEX "HouseholdEntry_cardId_idx" ON "HouseholdEntry"("cardId");

-- CreateIndex
CREATE INDEX "HumanContactAssignment_personId_idx" ON "HumanContactAssignment"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "HumanContactAssignment_personId_activity_cadence_key" ON "HumanContactAssignment"("personId", "activity", "cadence");

-- CreateIndex
CREATE INDEX "HumanContactLog_personId_createdAt_idx" ON "HumanContactLog"("personId", "createdAt");

-- AddForeignKey
ALTER TABLE "MindReadingLog" ADD CONSTRAINT "MindReadingLog_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "MindReadingBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindReadingLog" ADD CONSTRAINT "MindReadingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMeditationStep" ADD CONSTRAINT "MindMeditationStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "MindMeditationFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdCardTask" ADD CONSTRAINT "HouseholdCardTask_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "HouseholdCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdCardTask" ADD CONSTRAINT "HouseholdCardTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HouseholdTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdEntry" ADD CONSTRAINT "HouseholdEntry_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "HouseholdCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdEntry" ADD CONSTRAINT "HouseholdEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdEntry" ADD CONSTRAINT "HouseholdEntry_programRunId_fkey" FOREIGN KEY ("programRunId") REFERENCES "ProgramRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanContactAssignment" ADD CONSTRAINT "HumanContactAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "HumanContactPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanContactLog" ADD CONSTRAINT "HumanContactLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "HumanContactPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanContactLog" ADD CONSTRAINT "HumanContactLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
