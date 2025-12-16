-- CreateTable HouseholdTask
CREATE TABLE "HouseholdTask" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable HouseholdCard
CREATE TABLE "HouseholdCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable HouseholdCardTask
CREATE TABLE "HouseholdCardTask" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "HouseholdCardTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable HouseholdEntry
CREATE TABLE "HouseholdEntry" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programRunId" TEXT,
    "completedTaskIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdEntry_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "HouseholdCardTask_cardId_taskId_key" ON "HouseholdCardTask"("cardId", "taskId");
CREATE INDEX "HouseholdEntry_createdAt_idx" ON "HouseholdEntry"("createdAt");
CREATE INDEX "HouseholdEntry_cardId_idx" ON "HouseholdEntry"("cardId");

-- Foreign keys
ALTER TABLE "HouseholdCardTask"
  ADD CONSTRAINT "HouseholdCardTask_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "HouseholdCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HouseholdCardTask"
  ADD CONSTRAINT "HouseholdCardTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HouseholdTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HouseholdEntry"
  ADD CONSTRAINT "HouseholdEntry_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "HouseholdCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HouseholdEntry"
  ADD CONSTRAINT "HouseholdEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HouseholdEntry"
  ADD CONSTRAINT "HouseholdEntry_programRunId_fkey" FOREIGN KEY ("programRunId") REFERENCES "ProgramRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
