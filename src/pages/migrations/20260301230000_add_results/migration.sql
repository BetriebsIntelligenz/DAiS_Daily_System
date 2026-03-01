-- CreateTable
CREATE TABLE "ResultObject" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎯',
    "startDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stakeholder" TEXT,
    "outputFileType" TEXT,
    "checklist" JSONB NOT NULL,
    "artifacts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultLogEntry" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "logType" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResultObject_userId_idx" ON "ResultObject"("userId");

-- CreateIndex
CREATE INDEX "ResultObject_updatedAt_idx" ON "ResultObject"("updatedAt");

-- CreateIndex
CREATE INDEX "ResultLogEntry_resultId_createdAt_idx" ON "ResultLogEntry"("resultId", "createdAt");

-- AddForeignKey
ALTER TABLE "ResultObject" ADD CONSTRAINT "ResultObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultLogEntry" ADD CONSTRAINT "ResultLogEntry_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ResultObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultLogEntry" ADD CONSTRAINT "ResultLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
