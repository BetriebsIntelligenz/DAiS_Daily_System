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
ALTER TABLE "RequirementLog"
ADD CONSTRAINT "RequirementLog_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementLog"
ADD CONSTRAINT "RequirementLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
