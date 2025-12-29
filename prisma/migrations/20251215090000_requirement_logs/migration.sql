DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'RequirementLog'
          AND table_schema = 'public'
    ) THEN
        CREATE TABLE "RequirementLog" (
            "id" TEXT NOT NULL,
            "requirementId" TEXT NOT NULL,
            "userId" TEXT,
            "content" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "RequirementLog_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RequirementLog_requirementId_idx" ON "RequirementLog"("requirementId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'RequirementLog_requirementId_fkey'
    ) THEN
        ALTER TABLE "RequirementLog"
        ADD CONSTRAINT "RequirementLog_requirementId_fkey"
        FOREIGN KEY ("requirementId")
        REFERENCES "Requirement"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'RequirementLog_userId_fkey'
    ) THEN
        ALTER TABLE "RequirementLog"
        ADD CONSTRAINT "RequirementLog_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
